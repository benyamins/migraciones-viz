import { tenths, wholePax } from './pax'
import { SEGMENTS_PER_HOUR, sum60, tenthsBySegment } from './segments'
import type { PaxRow } from './types'

export interface SagHour {
	/** 'HH:00' */
	hour: string
	/** Passengers in the clock hour, rounded. */
	pax: number
	/**
	 * The 60 minutes that set the hour's channels (scripts/prepare.sql, step 4): their first
	 * 10-minute segment of the day, and their passengers, rounded as in prepare.sql.
	 */
	peak: { start: number; pax: number }
	sc: number
	k9: number
}

/** One row per hour for the arrival rows of a single day, in time order. */
export function summarizeSagByHour(rows: PaxRow[]): SagHour[] {
	const segments = tenthsBySegment(rows)
	const hours = new Map<string, SagHour>()
	for (const row of rows) {
		const hour = `${row.dt_segmento.slice(11, 13)}:00`
		const summary = hours.get(hour)
		if (summary) {
			summary.pax += tenths(row.pax)
			continue
		}
		// prepare.sql gives every segment of an hour the same channels and window
		const start = Number(row.dt_segmento.slice(11, 13)) * SEGMENTS_PER_HOUR + (row.sag_desde_min ?? 0) / 10
		hours.set(hour, {
			hour,
			pax: tenths(row.pax),
			peak: { start, pax: wholePax(sum60(segments, start)) },
			sc: row.sc_channels ?? 0,
			k9: row.k9_channels ?? 0,
		})
	}
	return [...hours.values()].map(summary => ({ ...summary, pax: wholePax(summary.pax) }))
}
