import { decompress } from 'fzstd'
import { parquetMetadata, parquetReadObjects } from 'hyparquet'
import type { PaxRow, SagRule } from './types'

// hyparquet only decodes SNAPPY by itself; ZSTD comes from fzstd. fzstd's decompress takes an
// output buffer as its second argument, while hyparquet passes the expected length, so wrap it.
const compressors = { ZSTD: (input: Uint8Array) => decompress(input) }

/** A row as hyparquet returns it: the TIMESTAMP column arrives as a Date. */
interface ParquetRow extends Omit<PaxRow, 'dt_segmento'> {
	dt_segmento: Date
}

export interface PaxData {
	rows: PaxRow[]
	/** When scripts/prepare.sql generated the file (undefined for files without that metadata). */
	updatedAt?: Date
	/** The SAG rules prepare.sql applied, from the fewest passengers up (empty for files without them). */
	sagRules: SagRule[]
}

export async function loadPax(): Promise<PaxData> {
	// One plain GET. For a file this small, asyncBufferFromUrl would send a HEAD
	// and then read the whole file twice (footer read + row group read).
	const response = await fetch(`${import.meta.env.BASE_URL}data/pax.parquet`)
	if (!response.ok) throw new Error(`HTTP ${response.status}`)

	const file = await response.arrayBuffer()
	// The footer describes the file, including the key-value pairs prepare.sql writes into it.
	// Parsing it here and handing it to parquetReadObjects avoids parsing it twice.
	const metadata = parquetMetadata(file)
	const footer = (key: string) => metadata.key_value_metadata?.find(kv => kv.key === key)?.value
	const updated = footer('actualizado')
	const rules = footer('sag_reglas')
	const rows = await parquetReadObjects({ file, metadata, compressors }) as ParquetRow[]

	return {
		// Adapt the file's types to the plain values the rest of the app uses
		rows: rows.map(row => ({
			...row,
			// The timestamp has no time zone and hyparquet reads it as UTC, so its UTC ISO
			// text is the wall-clock time as written ('2026-02-01T00:10:00').
			dt_segmento: row.dt_segmento.toISOString().slice(0, 19),
			// DECIMAL arrives as an integer × 0.1, which adds float noise (52.400000000000006)
			pax: Math.round(row.pax * 10) / 10,
		})),
		// Written in UTC ('2026-09-29T16:34:44Z'); shown in Chile's time by PageHeader.vue
		updatedAt: updated ? new Date(updated) : undefined,
		// JSON, already sorted by prepare.sql
		sagRules: rules ? JSON.parse(rules) as SagRule[] : [],
	}
}
