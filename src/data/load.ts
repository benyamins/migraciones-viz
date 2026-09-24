import { decompress } from 'fzstd'
import { parquetReadObjects } from 'hyparquet'
import type { PaxRow } from './types'

// hyparquet only decodes SNAPPY by itself; ZSTD comes from fzstd. fzstd's decompress takes an
// output buffer as its second argument, while hyparquet passes the expected length, so wrap it.
const compressors = { ZSTD: (input: Uint8Array) => decompress(input) }

/** A row as hyparquet returns it: the TIMESTAMP column arrives as a Date. */
interface ParquetRow extends Omit<PaxRow, 'dt_segmento'> {
	dt_segmento: Date
}

export async function loadPax(): Promise<PaxRow[]> {
	// One plain GET. For a file this small, asyncBufferFromUrl would send a HEAD
	// and then read the whole file twice (footer read + row group read).
	const response = await fetch(`${import.meta.env.BASE_URL}data/pax.parquet`)
	if (!response.ok) throw new Error(`HTTP ${response.status}`)

	const file = await response.arrayBuffer()
	const rows = await parquetReadObjects({ file, compressors }) as ParquetRow[]

	// Adapt the file's types to the plain values the rest of the app uses
	return rows.map(row => ({
		...row,
		// The timestamp has no time zone and hyparquet reads it as UTC, so its UTC ISO
		// text is the wall-clock time as written ('2026-02-01T00:10:00').
		dt_segmento: row.dt_segmento.toISOString().slice(0, 19),
		// DECIMAL arrives as an integer × 0.1, which adds float noise (52.400000000000006)
		pax: Math.round(row.pax * 10) / 10,
	}))
}
