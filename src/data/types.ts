export type Tipo = 'llegada' | 'salida'

/** One 10-minute segment for one direction, as returned by loadPax (src/data/load.ts). */
export interface PaxRow {
	/** Local wall-clock time 'YYYY-MM-DDTHH:MM:SS', deliberately without a time zone. */
	dt_segmento: string
	tipo: Tipo
	pax: number
	pdi_npu: number
	cap_percentil_75: number
	cap_aplanada: number
}

/** Process shown for each direction (the source's `proceso` column maps 1:1 to `tipo`). */
export const PROCESOS: Record<Tipo, string> = {
	llegada: 'Inmigración',
	salida: 'Emigración',
}
