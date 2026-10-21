<script setup lang="ts">
import { useDark } from '@vueuse/core'
import type { LineSeriesOption, YAXisComponentOption } from 'echarts'
import { computed, ref } from 'vue'
import { formatLongDate, formatTime, wallClockToMs } from '../data/days'
import type { SagHour } from '../data/sag'
import { windowLabel } from '../data/segments'
import type { PaxRow } from '../data/types'
import { CHART_THEME, type ColorMode } from '../lib/chartTheme'
import { dayAxis, FONT, HOUR, tooltipStyle } from '../lib/dayChart'
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from '../lib/echarts'
import EChart from './EChart.vue'

const props = defineProps<{
	/** Arrival rows of a single day, in time order. */
	rows: PaxRow[]
	/** The same day by hour (summarizeSagByHour), for the 60 minutes behind each hour's counts. */
	hours: SagHour[]
	/** 'YYYY-MM-DD' */
	day: string
	/** Top of the left axis: the largest number of channels or pórticos in the rules. */
	maxCount: number
}>()

interface ChannelDef {
	key: 'sc_channels' | 'k9_channels'
	name: string
	color: Record<ColorMode, string>
}

// Stacked in this order: SC at the bottom, K9 on top (also the legend and tooltip order).
// Two blues of the gob scale (blue means capacity, as on PDI), SC the darker one in both modes.
// Checked with the dataviz palette script: light and dark pairs are far apart for every color
// vision (ΔE 24 or more). K9's light blue is under 3:1 on white, so the table shows the numbers.
const CHANNELS: ChannelDef[] = [
	{ key: 'sc_channels', name: 'SC', color: { light: '#0051a8', dark: '#0f69c4' } },
	{ key: 'k9_channels', name: 'K9', color: { light: '#83b6ff', dark: '#83b6ff' } },
]

// Pórticos: a step line on the channels' axis, drawn over everything. Red from the gob.cl tokens
// (accent darken-3 in light mode, data-qualitative-01 in dark mode), 4.9:1 on white and 5.3:1
// on the dark card. The palette script puts it at ΔE 14.7 or more from the teal and the blues
// for every color vision.
const PORTICOS: Record<ColorMode, string> = { light: '#d72c25', dark: '#fa4d56' }

// Passengers: the same teal as on PDI. A line without the fill: a fill would hide behind the
// stack, or tint it. Its halo, in the card's color, keeps it readable where it crosses a blue.
const PAX = {
	text: { light: '#007a77', dark: '#5eead4' },
	line: { light: '#009d9a', dark: '#2dd4bf' },
}
const SURFACE: Record<ColorMode, string> = { light: '#ffffff', dark: '#0f172a' }

// Follows the `dark` class Nuxt UI's color mode toggle puts on <html>.
const isDark = useDark()
const mode = computed<ColorMode>(() => isDark.value ? 'dark' : 'light')

/** Passengers on a second y axis, on by default as on PDI. */
const showPax = ref(true)

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

function count(value: unknown, one: string, many: string): string {
	if (typeof value !== 'number') return '–'
	return `${integer.format(value)} ${value === 1 ? one : many}`
}

const UNITS: Record<string, [string, string]> = {
	pax: ['pasajero', 'pasajeros'],
	porticos: ['pórtico', 'pórticos'],
}

// ECharts inserts this HTML as-is. It's safe because series names are our own constants;
// escape with echarts.format.encodeHTML if they ever come from the data.
function tooltip(params: TooltipComponentFormatterCallbackParams): string {
	const items = (Array.isArray(params) ? params : [params]).filter(item => !String(item.seriesId).endsWith('-halo'))
	const [time] = items[0].value as [number, number]
	const lines = items.map(item => {
		const [, value] = item.value as [number, number]
		const [one, many] = UNITS[item.seriesId as string] ?? ['canal', 'canales']
		return `<div class="flex items-center gap-2 leading-6">
			<span class="size-2.5 shrink-0 rounded-full" style="background:${item.color}"></span>
			<span class="flex-1 pr-6">${item.seriesName}</span>
			<b class="text-highlighted tabular-nums">${count(value, one, many)}</b>
		</div>`
	})
	// The 60 minutes that set this hour's channels and pórticos (scripts/prepare.sql, step 4).
	// The point at 24:00 only closes the last step, so it belongs to 23:00.
	const start = wallClockToMs(`${props.day}T00:00:00`)
	const hour = props.hours[Math.min(Math.floor((time - start) / HOUR), 23)]
	const peak = hour
		? `<div class="mt-1 border-t border-default pt-1 text-xs">Máx. 60 min: <b class="text-highlighted tabular-nums">${windowLabel(hour.peak.start)} (${integer.format(hour.peak.pax)})</b></div>`
		: ''
	const label = time >= start + 24 * HOUR ? '24:00' : formatTime(time)
	return `<div class="mb-1 font-semibold text-highlighted">${label}</div>${lines.join('')}${peak}`
}

// computed: re-runs when the rows, day, color mode or the passengers switch change,
// and EChart.vue's watch then pushes the new object into the chart.
const option = computed<EChartsOption>(() => {
	const theme = CHART_THEME[mode.value]
	const surface = SURFACE[mode.value]
	const end = wallClockToMs(`${props.day}T00:00:00`) + 24 * HOUR

	/** One value per hour, held from the hour's first segment; the extra point closes 23:50–24:00. */
	function hourly(key: 'sc_channels' | 'k9_channels' | 'porticos') {
		const points = props.rows.map(row => [wallClockToMs(row.dt_segmento), row[key]])
		return points.length ? [...points, [end, points[points.length - 1][1]]] : []
	}

	const yAxis: YAXisComponentOption[] = [{
		type: 'value',
		name: 'Canales y pórticos',
		min: 0,
		max: props.maxCount,
		interval: 1,
		nameTextStyle: { align: 'left', color: theme.text },
		axisLabel: { color: theme.text },
		splitLine: { lineStyle: { color: theme.grid } },
	}]

	const series: LineSeriesOption[] = CHANNELS.map((c, i) => ({
		id: c.key,
		name: c.name,
		type: 'line',
		stack: 'canales',
		// each hour's channels hold until the next segment
		step: 'end',
		data: hourly(c.key),
		// no dots on hover either: the areas are read by their height
		symbol: 'none',
		color: c.color[mode.value],
		areaStyle: { color: c.color[mode.value], opacity: 1 },
		// SC's top edge, in the card's color and drawn over K9: the 2px gap between the two
		lineStyle: { width: i === 0 ? 2 : 0, color: surface },
		z: i === 0 ? 3 : 2,
	}))

	if (showPax.value) {
		yAxis.push({
			type: 'value',
			name: 'Pasajeros',
			position: 'right',
			// USWDS: line charts start at zero, on both axes
			min: 0,
			minInterval: 1,
			// ticks at the same heights as the left axis', so the grid stays one set of lines
			alignTicks: true,
			nameTextStyle: { align: 'right', color: PAX.text[mode.value] },
			axisLabel: { color: PAX.text[mode.value], formatter: (value: number) => integer.format(value) },
			splitLine: { show: false },
		})
		const data = props.rows.map(row => [wallClockToMs(row.dt_segmento), Math.round(row.pax)])
		// first in the list, so the tooltip follows the legend's order; z draws them over the stack
		series.unshift(
			{
				id: 'pax-halo',
				name: 'Pasajeros',
				type: 'line',
				yAxisIndex: 1,
				step: 'end',
				data,
				symbol: 'none',
				silent: true,
				lineStyle: { width: 6, color: surface },
				z: 4,
			},
			{
				id: 'pax',
				name: 'Pasajeros',
				type: 'line',
				yAxisIndex: 1,
				step: 'end',
				data,
				showSymbol: false,
				color: PAX.line[mode.value],
				lineStyle: { width: 2 },
				z: 5,
			},
		)
	}

	// Last in the tooltip, as in the legend, and on top: where it runs along the stack's top edge
	// (as many pórticos as channels), its halo keeps the two apart
	const porticos = hourly('porticos')
	series.push(
		{
			id: 'porticos-halo',
			name: 'Pórticos',
			type: 'line',
			step: 'end',
			data: porticos,
			symbol: 'none',
			silent: true,
			lineStyle: { width: 7, color: surface },
			z: 6,
		},
		{
			id: 'porticos',
			name: 'Pórticos',
			type: 'line',
			step: 'end',
			data: porticos,
			showSymbol: false,
			color: PORTICOS[mode.value],
			lineStyle: { width: 3 },
			z: 7,
		},
	)

	return {
		// x values are wall-clock times read as UTC (see data/days.ts), so format them in UTC too
		useUTC: true,
		aria: {
			enabled: true,
			label: {
				description: `Canales SC y K9 abiertos y pórticos por intervalo de 10 minutos, llegadas, ${formatLongDate(props.day)}.${showPax.value ? ' Con los pasajeros por intervalo en el eje derecho.' : ''}`,
			},
		},
		textStyle: { fontFamily: FONT },
		animationDurationUpdate: 300,
		grid: { left: 0, right: 8, top: 32, bottom: 0, containLabel: true },
		tooltip: { ...tooltipStyle(theme), trigger: 'axis', formatter: tooltip },
		// the same hourly x axis as CapacityChart
		...dayAxis(props.day, theme),
		yAxis,
		series,
	}
})
</script>

<template>
	<figure>
		<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
			<ul class="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-toned">
				<li v-if="showPax" class="flex items-center gap-2">
					<span class="w-6" :style="{ borderTop: `2px solid ${PAX.line[mode]}` }" />
					Pasajeros (eje derecho)
				</li>
				<li v-for="c in CHANNELS" :key="c.key" class="flex items-center gap-2">
					<span class="h-3 w-6 rounded-xs" :style="{ background: c.color[mode] }" />
					{{ c.name }}
				</li>
				<li class="flex items-center gap-2">
					<span class="w-6" :style="{ borderTop: `3px solid ${PORTICOS[mode]}` }" />
					Pórticos
				</li>
			</ul>
			<USwitch v-model="showPax" label="Mostrar pasajeros" size="lg" />
		</div>
		<EChart :option="option" class="mt-3 h-80 sm:h-96" />
	</figure>
</template>
