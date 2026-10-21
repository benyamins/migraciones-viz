INSTALL excel;
LOAD excel;

CREATE TEMP TABLE viz_data AS
SELECT
    -- Local wall-clock time, without a time zone (src/data/load.ts reads it as-is)
    dt_segmento::TIMESTAMP AS dt_segmento
    ,tipo
    -- One decimal as DECIMAL: stored as a small integer (pax × 10) instead of an 8-byte DOUBLE
    ,ROUND(pax::DOUBLE, 1)::DECIMAL(9, 1) AS pax
    ,pdi_npu::INTEGER AS pdi_npu
    ,cap_aplanada::INTEGER AS cap_aplanada
FROM
    read_xlsx(
        'data/source.xlsx',
        sheet = 'Capacidad aplanada',
        header = true
    )
;

-- ---------------------------------------------------------------------------------------------
-- Aduanas y SAG: the channels and pórticos for the passengers who arrive each hour.
-- No number from the rules is written here or in the site's code: to change them, edit the
-- sheets, run this script and push.
-- ---------------------------------------------------------------------------------------------

-- 1. The rules, in two sheets: one row per range of passengers per hour. `fila` is the row
--    number in Excel, for the error messages. stop_at_empty = false: rows after an empty row
--    still count.
CREATE TEMP TABLE sag_hoja AS
SELECT *
FROM (
    SELECT
        row_number() OVER () + 1 AS fila
        ,*
    FROM
        read_xlsx(
            'data/source.xlsx',
            sheet = 'capacidad_aduanas_sag',
            header = true,
            stop_at_empty = false
        )
)
WHERE NOT (pax_min IS NULL AND pax_max IS NULL AND channels_open IS NULL AND sc_channels IS NULL AND k9_channels IS NULL)
;

CREATE TEMP TABLE porticos_hoja AS
SELECT *
FROM (
    SELECT
        row_number() OVER () + 1 AS fila
        ,*
    FROM
        read_xlsx(
            'data/source.xlsx',
            sheet = 'porticos',
            header = true,
            stop_at_empty = false
        )
)
WHERE NOT (pax_min IS NULL AND pax_max IS NULL AND porticos IS NULL)
;

-- 2. Stop with a clear message if a sheet breaks a rule, so a bad sheet never reaches the site.
--    Together these mean that every number of passengers falls in exactly one range of each
--    sheet. Both sheets get the same checks: `valores` holds the numbers a range gives.
CREATE TEMP TABLE rangos AS
SELECT
    'capacidad_aduanas_sag' AS hoja
    ,fila
    ,pax_min
    ,pax_max
    ,[channels_open, sc_channels, k9_channels] AS valores
    ,sc_channels + k9_channels <> channels_open AS suma_distinta
FROM sag_hoja
UNION ALL
SELECT 'porticos', fila, pax_min, pax_max, [porticos], false
FROM porticos_hoja
;

SET VARIABLE sag_problemas = (
    WITH ordenadas AS (
        SELECT
            *
            ,row_number() OVER (PARTITION BY hoja ORDER BY pax_min) AS n
            ,count(*) OVER (PARTITION BY hoja) AS total
            ,lag(pax_max) OVER (PARTITION BY hoja ORDER BY pax_min) AS max_anterior
        FROM rangos
    )
    SELECT string_agg(problema, '; ' ORDER BY hoja, fila)
    FROM (
        SELECT hoja, 0 AS fila, format('Sheet {}: it has no rules', hoja) AS problema
        FROM (VALUES ('capacidad_aduanas_sag'), ('porticos')) hojas (hoja)
        WHERE hoja NOT IN (SELECT hoja FROM rangos)
        UNION ALL
        SELECT hoja, fila, format('Sheet {}, row {}: {}', hoja, fila, problema)
        FROM ordenadas,
        LATERAL (
            SELECT 'an empty cell (only pax_max of the last range is empty)' AS problema
            WHERE pax_min IS NULL OR len(list_filter(valores, lambda x: x IS NULL)) > 0
                OR (pax_max IS NULL AND n < total)
            UNION ALL
            SELECT 'the last range must leave pax_max empty'
            WHERE n = total AND pax_max IS NOT NULL
            UNION ALL
            SELECT 'a number below 0 or with decimals'
            WHERE len(list_filter([pax_min, pax_max] || valores, lambda x: x < 0 OR x <> round(x))) > 0
            UNION ALL
            SELECT 'the first range must start at 0'
            WHERE n = 1 AND pax_min <> 0
            UNION ALL
            SELECT format('pax_min must be {:g} (1 above the pax_max before it)', max_anterior + 1)
            WHERE n > 1 AND pax_min <> max_anterior + 1
            UNION ALL
            SELECT 'pax_max is below pax_min'
            WHERE pax_max < pax_min
            UNION ALL
            SELECT 'sc_channels + k9_channels must equal channels_open'
            WHERE suma_distinta
        )
    )
);
SET VARIABLE sag_ok = (
    SELECT CASE
        WHEN getvariable('sag_problemas') IS NOT NULL
        THEN error(getvariable('sag_problemas'))
        ELSE true
    END
);

CREATE TEMP TABLE sag_reglas AS
SELECT
    pax_min::INTEGER AS pax_min
    ,pax_max::INTEGER AS pax_max
    ,channels_open::INTEGER AS channels_open
    ,sc_channels::INTEGER AS sc_channels
    ,k9_channels::INTEGER AS k9_channels
FROM sag_hoja
;

CREATE TEMP TABLE porticos_reglas AS
SELECT
    pax_min::INTEGER AS pax_min
    ,pax_max::INTEGER AS pax_max
    ,porticos::INTEGER AS porticos
FROM porticos_hoja
;

-- 3. Every 60-minute window of arrivals inside a day: six 10-minute segments added up.
--    It adds the DECIMAL column, so the sums are exact. Windows that would end after midnight
--    have fewer than six segments and are left out.
CREATE TEMP TABLE sag_ventanas AS
SELECT dia, inicio, pax_60
FROM (
    SELECT
        dt_segmento::DATE AS dia
        ,dt_segmento AS inicio
        ,sum(pax) OVER seis AS pax_60
        ,count(*) OVER seis AS segmentos
    FROM viz_data
    WHERE tipo = 'llegada'
    WINDOW seis AS (
        PARTITION BY dt_segmento::DATE
        ORDER BY dt_segmento
        RANGE BETWEEN CURRENT ROW AND INTERVAL 50 MINUTE FOLLOWING
    )
)
WHERE segmentos = 6
;

-- 4. For each clock hour, the busiest window that spends at least 30 minutes inside it: those
--    that start from 30 minutes before the hour to 30 minutes after it, in the same day.
--    On a tie, the earliest. Its passengers are rounded to a whole number, like the rules.
CREATE TEMP TABLE sag_horas AS
SELECT hora, inicio, ROUND(pax_60)::INTEGER AS pax_60
FROM (
    SELECT
        h.hora
        ,v.inicio
        ,v.pax_60
        ,row_number() OVER (PARTITION BY h.hora ORDER BY v.pax_60 DESC, v.inicio) AS puesto
    FROM (SELECT DISTINCT date_trunc('hour', dt_segmento) AS hora FROM viz_data WHERE tipo = 'llegada') h
    JOIN sag_ventanas v
        ON v.dia = h.hora::DATE
        AND v.inicio BETWEEN h.hora - INTERVAL 30 MINUTE AND h.hora + INTERVAL 30 MINUTE
)
WHERE puesto = 1
;

-- 5. Each hour's range in each sheet: the same passengers set the channels and the pórticos
CREATE TEMP TABLE sag_por_hora AS
SELECT h.hora, h.inicio, r.sc_channels, r.k9_channels, p.porticos
FROM sag_horas h
JOIN sag_reglas r
    ON h.pax_60 >= r.pax_min
    AND (r.pax_max IS NULL OR h.pax_60 <= r.pax_max)
JOIN porticos_reglas p
    ON h.pax_60 >= p.pax_min
    AND (p.pax_max IS NULL OR h.pax_60 <= p.pax_max)
;
-- Only data with negative passengers can fail this, after the checks in step 2
SET VARIABLE sag_horas_ok = (
    SELECT CASE
        WHEN count(*) FILTER (WHERE c.hora IS NULL) > 0
        THEN error(format('{} arrival hours have no range in capacidad_aduanas_sag or porticos, the first at {}',
            count(*) FILTER (WHERE c.hora IS NULL), min(h.hora) FILTER (WHERE c.hora IS NULL)))
        ELSE true
    END
    FROM (SELECT DISTINCT date_trunc('hour', dt_segmento) AS hora FROM viz_data WHERE tipo = 'llegada') h
    LEFT JOIN sag_por_hora c USING (hora)
);

-- 6. Both sets of rules, as JSON. They record which rules made this file, and the page takes
--    the top of the chart's left axis from them.
SET VARIABLE sag_reglas = (SELECT to_json(list(r ORDER BY pax_min))::VARCHAR FROM sag_reglas r);
SET VARIABLE porticos_reglas = (SELECT to_json(list(r ORDER BY pax_min))::VARCHAR FROM porticos_reglas r);

-- Size choices (measured on Feb, Apr and Sep 2026: 78 KB -> 47 KB):
-- - ORDER BY tipo first: each process's series is contiguous, so neighboring values are similar
-- - PARQUET_VERSION v2: allows delta encodings (each value stored as the difference to the previous)
-- - DICTIONARY_SIZE_LIMIT 1000: dictionary encoding only for columns with up to 1000 distinct values
--   (tipo, booth counts); pax and dt_segmento have more, and compress better as deltas
-- - COMPRESSION_LEVEL 22: ZSTD's maximum; slower to write, just as fast to read
-- KV_METADATA stores in the file's footer when this ran (UTC; the site shows it as "Datos
-- actualizados") and the rules from step 6.
COPY (
    -- 7. Each arrival segment gets its hour's channels and pórticos, so the chart steps on the
    --    hour. Departure rows get NULL.
    SELECT
        v.*
        ,c.sc_channels::UTINYINT AS sc_channels
        ,c.k9_channels::UTINYINT AS k9_channels
        ,c.porticos::UTINYINT AS porticos
        -- where the 60 minutes that set the hour's channels and pórticos start, in minutes from
        -- the start of the hour (-30 to 30). The page adds up those six segments to show them.
        ,date_diff('minute', c.hora, c.inicio)::TINYINT AS sag_desde_min
    FROM viz_data v
    LEFT JOIN sag_por_hora c
        ON v.tipo = 'llegada'
        AND c.hora = date_trunc('hour', v.dt_segmento)
    ORDER BY v.tipo, v.dt_segmento
)
TO 'public/data/pax.parquet'
(
    FORMAT PARQUET
    ,COMPRESSION zstd
    ,COMPRESSION_LEVEL 22
    ,PARQUET_VERSION v2
    ,DICTIONARY_SIZE_LIMIT 1000
    ,KV_METADATA {
        actualizado: strftime(timezone('UTC', now()), '%Y-%m-%dT%H:%M:%SZ'),
        sag_reglas: getvariable('sag_reglas'),
        porticos_reglas: getvariable('porticos_reglas')
    }
);
