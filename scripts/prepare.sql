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
    ,cap_percentil_75::INTEGER AS cap_percentil_75
    ,cap_aplanada::INTEGER AS cap_aplanada
FROM
    read_xlsx(
        'data/source.xlsx',
        sheet = 'Capacidad aplanada',
        header = true
    )
;

-- ---------------------------------------------------------------------------------------------
-- Aduanas y SAG: the channels to open for the passengers who arrive each hour.
-- No number from the rules is written here or in the site's code: to change them, edit the
-- sheet, run this script and push.
-- ---------------------------------------------------------------------------------------------

-- 1. The rules, one row per range of passengers per hour. `fila` is the row number in Excel,
--    for the error messages. stop_at_empty = false: rows after an empty row still count.
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

-- 2. Stop with a clear message if the sheet breaks a rule, so a bad sheet never reaches the site.
--    Together these mean that every number of passengers falls in exactly one range.
SET VARIABLE sag_problemas = (
    WITH ordenadas AS (
        SELECT
            *
            ,row_number() OVER (ORDER BY pax_min) AS n
            ,count(*) OVER () AS total
            ,lag(pax_max) OVER (ORDER BY pax_min) AS max_anterior
        FROM sag_hoja
    )
    SELECT string_agg(problema, '; ')
    FROM (
        SELECT 'it has no rules' AS problema
        WHERE NOT EXISTS (FROM sag_hoja)
        UNION ALL
        SELECT format('row {}: {}', fila, problema)
        FROM ordenadas,
        LATERAL (
            SELECT 'an empty cell (only pax_max of the last range is empty)' AS problema
            WHERE pax_min IS NULL OR channels_open IS NULL OR sc_channels IS NULL OR k9_channels IS NULL
                OR (pax_max IS NULL AND n < total)
            UNION ALL
            SELECT 'the last range must leave pax_max empty'
            WHERE n = total AND pax_max IS NOT NULL
            UNION ALL
            SELECT 'a number below 0 or with decimals'
            WHERE [pax_min, pax_max, channels_open, sc_channels, k9_channels]
                .list_filter(lambda x: x < 0 OR x <> round(x)).len() > 0
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
            WHERE sc_channels + k9_channels <> channels_open
        )
    )
);
SET VARIABLE sag_ok = (
    SELECT CASE
        WHEN getvariable('sag_problemas') IS NOT NULL
        THEN error('Sheet capacidad_aduanas_sag: ' || getvariable('sag_problemas'))
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

-- 5. Each hour's range in the rules
CREATE TEMP TABLE sag_canales AS
SELECT h.hora, h.inicio, r.sc_channels, r.k9_channels
FROM sag_horas h
JOIN sag_reglas r
    ON h.pax_60 >= r.pax_min
    AND (r.pax_max IS NULL OR h.pax_60 <= r.pax_max)
;
-- Only data with negative passengers can fail this, after the checks in step 2
SET VARIABLE sag_horas_ok = (
    SELECT CASE
        WHEN count(*) FILTER (WHERE c.hora IS NULL) > 0
        THEN error(format('{} arrival hours have no range in capacidad_aduanas_sag, the first at {}',
            count(*) FILTER (WHERE c.hora IS NULL), min(h.hora) FILTER (WHERE c.hora IS NULL)))
        ELSE true
    END
    FROM (SELECT DISTINCT date_trunc('hour', dt_segmento) AS hora FROM viz_data WHERE tipo = 'llegada') h
    LEFT JOIN sag_canales c USING (hora)
);

-- 6. The rules, as JSON, for the page's "Cómo se calcula" table
SET VARIABLE sag_reglas = (SELECT to_json(list(r ORDER BY pax_min))::VARCHAR FROM sag_reglas r);

-- Size choices (measured on Feb, Apr and Sep 2026: 78 KB -> 47 KB):
-- - ORDER BY tipo first: each process's series is contiguous, so neighboring values are similar
-- - PARQUET_VERSION v2: allows delta encodings (each value stored as the difference to the previous)
-- - DICTIONARY_SIZE_LIMIT 1000: dictionary encoding only for columns with up to 1000 distinct values
--   (tipo, booth counts); pax and dt_segmento have more, and compress better as deltas
-- - COMPRESSION_LEVEL 22: ZSTD's maximum; slower to write, just as fast to read
-- KV_METADATA stores in the file's footer when this ran (UTC; the site shows it as "Datos
-- actualizados") and the SAG rules from step 6.
COPY (
    -- 7. Each arrival segment gets its hour's channels, so the chart steps on the hour.
    --    Departure rows get NULL.
    SELECT
        v.*
        ,c.sc_channels::UTINYINT AS sc_channels
        ,c.k9_channels::UTINYINT AS k9_channels
        -- where the 60 minutes that set the hour's channels start, in minutes from the start of
        -- the hour (-30 to 30). The page adds up those six segments to show them.
        ,date_diff('minute', c.hora, c.inicio)::TINYINT AS sag_desde_min
    FROM viz_data v
    LEFT JOIN sag_canales c
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
        sag_reglas: getvariable('sag_reglas')
    }
);
