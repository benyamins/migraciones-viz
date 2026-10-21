export type Tipo = 'llegada' | 'salida'

/** One 10-minute segment for one direction, as returned by loadPax (src/data/load.ts). */
export interface PaxRow {
	/** Local wall-clock time 'YYYY-MM-DDTHH:MM:SS', deliberately without a time zone. */
	dt_segmento: string
	tipo: Tipo
	pax: number
	pdi_npu: number
	cap_aplanada: number
	/** Aduanas y SAG channels open in the segment's hour. Arrivals only: null for departures. */
	sc_channels: number | null
	k9_channels: number | null
	/** Pórticos in the segment's hour, set by the same passengers as the channels. Null for departures. */
	porticos: number | null
	/**
	 * Where the 60 minutes that set the hour's channels and pórticos start, in minutes from the
	 * start of the hour (-30 to 30). Null for departures. See scripts/prepare.sql.
	 */
	sag_desde_min: number | null
}

/** A row of the capacidad_aduanas_sag sheet: the channels for a range of passengers per hour. */
export interface SagRule {
	pax_min: number
	/** null in the last range: no maximum */
	pax_max: number | null
	channels_open: number
	sc_channels: number
	k9_channels: number
}

/** A row of the porticos sheet: the pórticos for a range of passengers per hour. */
export interface PorticoRule {
	pax_min: number
	/** null in the last range: no maximum */
	pax_max: number | null
	porticos: number
}

/** Process shown for each direction (the source's `proceso` column maps 1:1 to `tipo`). */
export const PROCESOS: Record<Tipo, string> = {
	llegada: 'Inmigración',
	salida: 'Emigración',
}

/** For values from outside, like the URL's ?proceso= */
export function isTipo(value: unknown): value is Tipo {
	return value === 'llegada' || value === 'salida'
}
