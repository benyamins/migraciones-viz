import { parquetReadObjects } from 'hyparquet'
import { decompressZstd } from 'hyparquet-compressors'
import type { PaxRow } from './types'

const base = `${import.meta.env.BASE_URL}data/`

// hyparquet only decodes SNAPPY by itself. fzstd's decompress takes an output buffer as
// its second argument, while hyparquet passes the expected length, so it must be wrapped.
const compressors = { ZSTD: (input: Uint8Array) => decompressZstd(input) }

export async function loadParquet(): Promise<PaxRow[]> {
	// One plain GET. For a file this small, asyncBufferFromUrl would send a HEAD
	// and then read the whole file twice (footer read + row group read).
	const response = await fetch(`${base}pax.parquet`)
	if (!response.ok) throw new Error(`HTTP ${response.status}`)

	const file = await response.arrayBuffer()
	return await parquetReadObjects({ file, compressors }) as PaxRow[]
}

export async function loadJsonGzip(): Promise<PaxRow[]> {
	const response = await fetch(`${base}pax.json.gz`)
	if (!response.ok) throw new Error(`HTTP ${response.status}`)

	const bytes = new Uint8Array(await response.arrayBuffer())

	// The Vite dev server sends .gz files with Content-Encoding: gzip, so the
	// browser has already decompressed them; other servers send the raw gzip bytes.
	const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b

	if (!isGzip) return JSON.parse(new TextDecoder().decode(bytes))

	const stream = new Blob([bytes]).stream()
		.pipeThrough(new DecompressionStream('gzip'))

	return new Response(stream).json()
}

/** Parquet by default; add `?format=json` to the URL to compare both in the Network tab. */
export function loadPax(): Promise<PaxRow[]> {
	const format = new URLSearchParams(location.search).get('format')
	return format === 'json' ? loadJsonGzip() : loadParquet()
}
