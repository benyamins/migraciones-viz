import { wholePax } from './pax'
import { busiest60, SEGMENTS_PER_HOUR, sum60, tenthsBySegment } from './segments'
import type { PaxRow, Tipo } from './types'

export interface DaySummary {
	/** 'YYYY-MM-DD' */
	day: string
	/** Passengers in each clock hour, 00 to 23 (the six 10-minute segments added up), rounded. */
	hours: number[]
	/** The day's passengers, rounded. */
	total: number
	/** Hora punta: the day's busiest 60 minutes. `start` is their first 10-minute segment (0 to 138). */
	peak: { start: number; pax: number }
}

/** 'YYYY-MM' of every month with data, sorted. */
export function monthsOf(days: string[]): string[] {
	return [...new Set(days.map(day => day.slice(0, 7)))].sort()
}

/** One summary per day of `month` ('YYYY-MM') for one direction, in date order. */
export function summarizeMonth(byDay: Map<string, PaxRow[]>, month: string, tipo: Tipo): DaySummary[] {
	return [...byDay.keys()]
		.filter(day => day.startsWith(month))
		.sort()
		.map(day => summarizeDay(day, byDay.get(day)!.filter(row => row.tipo === tipo)))
}

function summarizeDay(day: string, rows: PaxRow[]): DaySummary {
	// Everything adds whole tenths and rounds at the end (see pax.ts)
	const segments = tenthsBySegment(rows)
	// A whole day always has its 139 windows
	const peak = busiest60(segments)!
	return {
		day,
		hours: Array.from({ length: 24 }, (_, hour) => wholePax(sum60(segments, hour * SEGMENTS_PER_HOUR))),
		total: wholePax(segments.reduce((sum, value) => sum + value, 0)),
		peak: { start: peak.start, pax: wholePax(peak.tenths) },
	}
}

/** A day's busiest 60 minutes. `start` is their first 10-minute segment. */
export interface Peak {
	/** 'YYYY-MM-DD' */
	day: string
	start: number
	pax: number
}

/** What the cards above the heatmap rank (see monthHighlights). */
export interface Highlights {
	/** true: from today to the month's end; false: the whole month */
	fromToday: boolean
	/** The busiest days, busiest first */
	days: DaySummary[]
	/** The busiest 60 minutes, busiest first: one per day, its hora punta */
	peaks: Peak[]
}

/**
 * The `count` busiest days and 60 minutes of a month, from its summaries (summarizeMonth's).
 * On the current month they count from today, since the days gone by don't help plan: today
 * counts in full for its total, but its 60 minutes that have already begun are left out, so it
 * ranks with what's still ahead. `now` is Chile's date and 10-minute segment (nowInChile), and
 * `todayRows` today's rows for the direction. Any other month counts in full. On a tie, the
 * earliest.
 */
export function monthHighlights(
	days: DaySummary[],
	now: { day: string; segment: number },
	todayRows: PaxRow[],
	count = 3,
): Highlights {
	const ahead = days.filter(summary => summary.day >= now.day)
	// A current month whose data ends before today counts in full too
	const fromToday = days[0]?.day.slice(0, 7) === now.day.slice(0, 7) && ahead.length > 0
	const scope = fromToday ? ahead : days

	const peaks: Peak[] = []
	for (const summary of scope) {
		if (!fromToday || summary.day !== now.day) {
			peaks.push({ day: summary.day, ...summary.peak })
			continue
		}
		const left = busiest60(tenthsBySegment(todayRows), now.segment + 1)
		if (left) peaks.push({ day: summary.day, start: left.start, pax: wholePax(left.tenths) })
	}

	return {
		fromToday,
		days: [...scope].sort((a, b) => b.total - a.total || a.day.localeCompare(b.day)).slice(0, count),
		peaks: peaks.sort((a, b) => b.pax - a.pax || a.day.localeCompare(b.day)).slice(0, count),
	}
}
