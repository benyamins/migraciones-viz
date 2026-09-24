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

-- Size choices (78 KB -> 47 KB for the three months of 2026):
-- - ORDER BY tipo first: each process's series is contiguous, so neighboring values are similar
-- - PARQUET_VERSION v2: allows delta encodings (each value stored as the difference to the previous)
-- - DICTIONARY_SIZE_LIMIT 1000: dictionary encoding only for columns with up to 1000 distinct values
--   (tipo, booth counts); pax and dt_segmento have more, and compress better as deltas
-- - COMPRESSION_LEVEL 22: ZSTD's maximum; slower to write, just as fast to read
COPY (
    SELECT * FROM viz_data ORDER BY tipo, dt_segmento
)
TO 'public/data/pax.parquet'
(
    FORMAT PARQUET
    ,COMPRESSION zstd
    ,COMPRESSION_LEVEL 22
    ,PARQUET_VERSION v2
    ,DICTIONARY_SIZE_LIMIT 1000
);
