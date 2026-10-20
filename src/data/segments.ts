import { tenths } from './pax'
import type { PaxRow } from './types'

/*
  A day as 144 ten-minute segments: segment 0 starts at 00:00, segment 143 at 23:50. Any six
  consecutive segments make 60 minutes, so a day has 139 such windows (00:00–01:00 up to
  23:00–24:00). Windows stay inside the day, like in scripts/prepare.sql.
*/

export const SEGMENTS_PER_DAY = 144
/** Ten-minute segments in 60 minutes */
export const SEGMENTS_PER_HOUR = 6

/** Segment of a 'YYYY-MM-DDTHH:MM:SS' time: 00:00 → 0, 23:50 → 143. */
export function segmentOf(dtSegmento: string): number {
	return Number(dtSegmento.slice(11, 13)) * SEGMENTS_PER_HOUR + Number(dtSegmento.slice(14, 16)) / 10
}

/** Start time of a segment: 50 → '08:20'. 144 (the end of the day) → '24:00'. */
export function segmentTime(segment: number): string {
	const minutes = segment * 10
	return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** The 60 minutes that start at a segment: 50 → '08:20–09:20'. */
export function windowLabel(start: number): string {
	return `${segmentTime(start)}–${segmentTime(start + SEGMENTS_PER_HOUR)}`
}

/** Passengers per segment, in whole tenths (see pax.ts), from the rows of one day and direction. */
export function tenthsBySegment(rows: PaxRow[]): number[] {
	const segments = new Array<number>(SEGMENTS_PER_DAY).fill(0)
	for (const row of rows) segments[segmentOf(row.dt_segmento)] = tenths(row.pax)
	return segments
}

/** Tenths in the 60 minutes that start at segment `start`. */
export function sum60(segments: number[], start: number): number {
	let sum = 0
	for (let i = start; i < start + SEGMENTS_PER_HOUR; i++) sum += segments[i]
	return sum
}

/** The day's busiest 60 minutes: their first segment and passengers (tenths). On a tie, the earliest. */
export function busiest60(segments: number[]): { start: number; tenths: number } {
	let best = { start: 0, tenths: -1 }
	for (let start = 0; start + SEGMENTS_PER_HOUR <= segments.length; start++) {
		const sum = sum60(segments, start)
		if (sum > best.tenths) best = { start, tenths: sum }
	}
	return best
}
