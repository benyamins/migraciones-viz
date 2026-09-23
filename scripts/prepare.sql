INSTALL excel;
LOAD excel;

CREATE TEMP TABLE viz_data AS
SELECT
    -- Keep local wall-clock time identical in both formats.
    strftime(
        dt_segmento::TIMESTAMP
        ,'%Y-%m-%dT%H:%M:%S'
    ) AS dt_segmento
    ,tipo
    ,ROUND(pax::DOUBLE, 1) AS pax
    ,pdi_npu::INTEGER AS pdi_npu
    ,cap_percentil_75::INTEGER AS cap_percentil_75
    ,cap_aplanada::INTEGER AS cap_aplanada
FROM
    read_xlsx(
        'data/source.xlsx',
        sheet = 'Capacidad aplanada',
        header = true
    )
ORDER BY
    dt_segmento
    ,tipo
;

COPY (
    SELECT * FROM viz_data ORDER BY dt_segmento, tipo
)
TO 'public/data/pax.parquet'
(FORMAT PARQUET, COMPRESSION zstd);

COPY (
    SELECT * FROM viz_data ORDER BY dt_segmento, tipo
)
TO 'public/data/pax.json.gz'
(FORMAT JSON, ARRAY true, COMPRESSION GZIP);
