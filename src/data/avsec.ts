import { tenths, wholePax } from './pax'
import type { AvsecRule, PaxRow } from './types'

/*
  AVSEC machines. Each 10-minute segment of departures needs the machines of the avsec range
  its passengers fall in. The rules come from the data file (scripts/prepare.sql checks that
  every number of passengers falls in exactly one range), so no number of theirs is written here.
  Applied here rather than stored in the file: each segment's machines follow from its own
  passengers, which the file already has.
*/

/**
 * Machines for a segment's passengers (one decimal), rounded to a whole number as the chart
 * shows them. null if no range fits: only a data file without the rules.
 */
export function machinesFor(pax: number, rules: AvsecRule[]): number | null {
	const whole = Math.round(pax)
	const rule = rules.find(r => whole >= r.pax_min && (r.pax_max === null || whole <= r.pax_max))
	return rule ? rule.maquinas : null
}

export interface AvsecHour {
	/** 'HH:00' */
	hour: string
	/** Passengers in the hour (sum of its 10-minute segments), rounded. */
	pax: number
	/** The most machines among the hour's segments, i.e. what had to be open, as for the booths on PDI. */
	maquinas: number | null
}

/** One row per hour for the departure rows of a single day, in time order. */
export function summarizeAvsecByHour(rows: PaxRow[], rules: AvsecRule[]): AvsecHour[] {
	const hours = new Map<string, AvsecHour>()
	for (const row of rows) {
		const hour = `${row.dt_segmento.slice(11, 13)}:00`
		const machines = machinesFor(row.pax, rules)
		const summary = hours.get(hour)
		if (!summary) {
			hours.set(hour, { hour, pax: tenths(row.pax), maquinas: machines })
			continue
		}
		summary.pax += tenths(row.pax)
		if (machines !== null && (summary.maquinas === null || machines > summary.maquinas)) summary.maquinas = machines
	}
	// pax adds up whole tenths (see pax.ts) and is rounded once at the end
	return [...hours.values()].map(summary => ({ ...summary, pax: wholePax(summary.pax) }))
}
