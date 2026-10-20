import { formatTime, wallClockToMs } from '../data/days'
import type { CHART_THEME } from './chartTheme'
import type { EChartsOption } from './echarts'

/*
  Parts shared by the day charts (CapacityChart, SagChart): the same x axis, hour labels and
  tooltip look, so both pages read the same way.
*/

export const HOUR = 3_600_000
export const FONT = '"Public Sans Variable", system-ui, sans-serif'

type Theme = (typeof CHART_THEME)['light']

/**
 * x axis from 00:00 to 24:00 of `day`, with one tick and grid line per hour, and the `media`
 * rules that print fewer hour labels on narrow charts.
 */
export function dayAxis(day: string, theme: Theme): Pick<EChartsOption, 'xAxis' | 'media'> {
	const start = wallClockToMs(`${day}T00:00:00`)
	const end = start + 24 * HOUR

	/** Label formatter that prints every `hours`-th hour (ticks and grid lines stay hourly). */
	const labelEvery = (hours: number) => (value: number) => {
		if (Math.round((value - start) / HOUR) % hours) return ''
		return value === end ? '24:00' : formatTime(value)
	}

	return {
		xAxis: {
			type: 'time',
			min: start,
			max: end,
			// one tick and one grid line per hour
			minInterval: HOUR,
			maxInterval: HOUR,
			axisLine: { lineStyle: { color: theme.axis } },
			axisTick: { lineStyle: { color: theme.axis } },
			axisLabel: { hideOverlap: true, color: theme.text, formatter: labelEvery(1) },
			splitLine: { show: true, lineStyle: { color: theme.hourLine } },
		},
		// Fewer hour labels on narrow charts. ECharts checks these against the chart's own
		// width on every resize and applies all matching entries in order (narrowest wins).
		// (Kept on the root option: wrapping the rest in `baseOption` triggers a bogus
		// "timeline is used but not imported" warning in ECharts' dev build.)
		media: [
			{ query: { maxWidth: 960 }, option: { xAxis: { axisLabel: { formatter: labelEvery(2) } } } },
			{ query: { maxWidth: 560 }, option: { xAxis: { axisLabel: { formatter: labelEvery(3) } } } },
			{ query: { maxWidth: 400 }, option: { xAxis: { axisLabel: { formatter: labelEvery(4) } } } },
		],
	}
}

/** The tooltip's box and text, without its trigger and formatter. */
export function tooltipStyle(theme: Theme) {
	return {
		// keeps the tooltip inside the chart on narrow screens
		confine: true,
		padding: [8, 12],
		backgroundColor: theme.tooltipBg,
		borderColor: theme.tooltipBorder,
		textStyle: { fontFamily: FONT, fontSize: 13, color: theme.tooltipText },
		axisPointer: { lineStyle: { color: theme.pointer } },
	}
}
