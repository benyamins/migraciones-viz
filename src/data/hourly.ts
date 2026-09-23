import type { PaxRow } from './types'

export interface HourSummary {
	/** 'HH:00' */
	hour: string
	/** Passengers in the hour (sum of its 10-minute segments), rounded. */
	pax: number
	/** Booth columns: the highest value among the hour's segments, i.e. what had to be staffed. */
	pdi_npu: number
	cap_percentil_75: number
	cap_aplanada: number
}

/** One row per hour for rows of a single day, in time order. */
export function summarizeByHour(rows: PaxRow[]): HourSummary[] {
	const hours = new Map<string, HourSummary>()
	for (const row of rows) {
		const hour = `${row.dt_segmento.slice(11, 13)}:00`
		const summary = hours.get(hour)
		if (!summary) {
			hours.set(hour, {
				hour,
				pax: row.pax,
				pdi_npu: row.pdi_npu,
				cap_percentil_75: row.cap_percentil_75,
				cap_aplanada: row.cap_aplanada,
			})
			continue
		}
		summary.pax += row.pax
		summary.pdi_npu = Math.max(summary.pdi_npu, row.pdi_npu)
		summary.cap_percentil_75 = Math.max(summary.cap_percentil_75, row.cap_percentil_75)
		summary.cap_aplanada = Math.max(summary.cap_aplanada, row.cap_aplanada)
	}
	// round once at the end so the 1-decimal pax values don't accumulate rounding errors
	return [...hours.values()].map(summary => ({ ...summary, pax: Math.round(summary.pax) }))
}
