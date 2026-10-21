<script setup lang="ts">
import { useDark } from '@vueuse/core'
import type { LineSeriesOption, YAXisComponentOption } from 'echarts'
import { computed, ref } from 'vue'
import { formatLongDate, formatTime, wallClockToMs } from '../data/days'
import type { PaxRow } from '../data/types'
import { CHART_THEME, type ColorMode } from '../lib/chartTheme'
import { dayAxis, FONT, tooltipStyle } from '../lib/dayChart'
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from '../lib/echarts'
import EChart from './EChart.vue'

const props = defineProps<{
	/** Rows of a single day and tipo, in time order. */
	rows: PaxRow[]
	/** 'YYYY-MM-DD' */
	day: string
	/** Process name, used in the description for screen readers. */
	proceso: string
}>()

interface SeriesDef {
	key: 'pdi_npu' | 'cap_aplanada'
	name: string
	/** gob.cl tokens; lighter steps in dark mode so the lines keep their contrast */
	color: Record<ColorMode, string>
	width: number
	/** Each value holds until the next segment starts. */
	step?: boolean
}

// The order here is the legend and tooltip order.
const SERIES: SeriesDef[] = [
	{ key: 'pdi_npu', name: 'NPU/PDI', color: { light: '#6b7c9c', dark: '#8596b6' }, width: 1.5 },
	{ key: 'cap_aplanada', name: 'Modelo aplanado', color: { light: '#003b8d', dark: '#83b6ff' }, width: 3, step: true },
]

// Passengers are another unit (people, not booths), so they get their own hue and axis
// (USWDS: don't reuse a color for different variables). `text` is darker than `line`
// so the axis labels keep 4.5:1 contrast.
const PAX = {
	text: { light: '#007a77', dark: '#5eead4' },
	line: { light: '#009d9a', dark: '#2dd4bf' },
	fill: { light: 'rgba(0, 157, 154, 0.14)', dark: 'rgba(45, 212, 191, 0.16)' },
}

// Follows the `dark` class Nuxt UI's color mode toggle puts on <html>.
const isDark = useDark()
const mode = computed<ColorMode>(() => isDark.value ? 'dark' : 'light')

/** Passengers on a second y axis. On by default: the booths follow the passengers. */
const showPax = ref(true)

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

function count(value: unknown, one: string, many: string): string {
	if (typeof value !== 'number') return '–'
	return `${integer.format(value)} ${value === 1 ? one : many}`
}

// ECharts inserts this HTML as-is. It's safe because series names are our own constants;
// escape with echarts.format.encodeHTML if they ever come from the data.
function tooltip(params: TooltipComponentFormatterCallbackParams): string {
	const items = Array.isArray(params) ? params : [params]
	const [time] = items[0].value as [number, number]
	const lines = items.map(item => {
		const [, value] = item.value as [number, number]
		const text = item.seriesId === 'pax' ? count(value, 'pasajero', 'pasajeros') : count(value, 'caseta', 'casetas')
		return `<div class="flex items-center gap-2 leading-6">
			<span class="size-2.5 shrink-0 rounded-full" style="background:${item.color}"></span>
			<span class="flex-1 pr-6">${item.seriesName}</span>
			<b class="text-highlighted tabular-nums">${text}</b>
		</div>`
	})
	return `<div class="mb-1 font-semibold text-highlighted">${formatTime(time)}</div>${lines.join('')}`
}

// computed: re-runs when the rows, day, color mode or the passengers switch change,
// and EChart.vue's watch then pushes the new object into the chart.
const option = computed<EChartsOption>(() => {
	const theme = CHART_THEME[mode.value]

	const yAxis: YAXisComponentOption[] = [{
		type: 'value',
		name: 'Casetas',
		min: 0,
		minInterval: 1,
		nameTextStyle: { align: 'left', color: theme.text },
		axisLabel: { color: theme.text },
		splitLine: { lineStyle: { color: theme.grid } },
	}]

	const series: LineSeriesOption[] = SERIES.map(s => ({
		id: s.key,
		name: s.name,
		type: 'line',
		step: s.step ? 'end' : false,
		showSymbol: false,
		color: s.color[mode.value],
		lineStyle: { width: s.width },
		data: props.rows.map(row => [wallClockToMs(row.dt_segmento), row[s.key]]),
	}))

	if (showPax.value) {
		yAxis.push({
			type: 'value',
			name: 'Pasajeros',
			position: 'right',
			// USWDS: line charts start at zero, on both axes
			min: 0,
			minInterval: 1,
			nameTextStyle: { align: 'right', color: PAX.text[mode.value] },
			axisLabel: { color: PAX.text[mode.value], formatter: (value: number) => integer.format(value) },
			// the booth axis already draws the horizontal grid
			splitLine: { show: false },
		})
		// first in the list: drawn behind the lines and listed first in the tooltip
		series.unshift({
			id: 'pax',
			name: 'Pasajeros',
			type: 'line',
			yAxisIndex: 1,
			step: 'end',
			showSymbol: false,
			color: PAX.line[mode.value],
			lineStyle: { width: 1 },
			areaStyle: { color: PAX.fill[mode.value] },
			data: props.rows.map(row => [wallClockToMs(row.dt_segmento), Math.round(row.pax)]),
		})
	}

	return {
		// x values are wall-clock times read as UTC (see data/days.ts), so format them in UTC too
		useUTC: true,
		aria: {
			enabled: true,
			label: {
				description: `Proyección de casetas por intervalo de 10 minutos, ${props.proceso}, ${formatLongDate(props.day)}. Series: ${series.map(s => s.name).join(', ')}.`,
			},
		},
		textStyle: { fontFamily: FONT },
		animationDurationUpdate: 300,
		grid: { left: 0, right: 8, top: 32, bottom: 0, containLabel: true },
		tooltip: { ...tooltipStyle(theme), trigger: 'axis', formatter: tooltip },
		// the same hourly x axis as SagChart
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
					<span
						class="h-3 w-6 rounded-xs"
						:style="{ background: PAX.fill[mode], borderTop: `1px solid ${PAX.line[mode]}` }"
					/>
					Pasajeros (eje derecho)
				</li>
				<li v-for="s in SERIES" :key="s.key" class="flex items-center gap-2">
					<span
						class="w-6"
						:style="{ borderTop: `${Math.max(s.width, 2)}px solid ${s.color[mode]}` }"
					/>
					{{ s.name }}
				</li>
			</ul>
			<USwitch v-model="showPax" label="Mostrar pasajeros" size="lg" />
		</div>
		<EChart :option="option" class="mt-3 h-80 sm:h-96" />
	</figure>
</template>
