<script setup lang="ts">
import { today } from '@internationalized/date'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatDayOfMonth, formatShortDate, isoWeekday } from '../data/days'
import type { DaySummary } from '../data/monthly'
import { SEGMENTS_PER_HOUR, segmentTime, windowLabel } from '../data/segments'
import { PROCESOS, type Tipo } from '../data/types'
import { heatClass } from '../lib/heat'
import { PAGES } from '../site'

const props = defineProps<{
	/** The month's days, in date order. */
	days: DaySummary[]
	tipo: Tipo
	/** 'octubre 2026', for the caption */
	monthLabel: string
	/**
	 * On a card under 81rem (MonthlyView) the numbers don't fit in the cells: 'chart' shows the
	 * colors only, fitted to the screen; 'table' shows every number and scrolls sideways.
	 * On wider cards both look the same.
	 */
	view: 'chart' | 'table'
	/** Passengers that fill a Total bar: the same for every month, so bars compare across months. */
	scaleMax: number
}>()

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
const todayDay = today('America/Santiago').toString()

const chart = computed(() => props.view === 'chart')

/** 'mié 21', or 'Hoy 21' for today: everyone knows today's weekday. */
function dayLabel(day: string) {
	return day === todayDay ? `Hoy ${Number(day.slice(8, 10))}` : formatDayOfMonth(day)
}

/** Link to the day on PDI: the overview here, the details there. */
function pdiLink(day: string) {
	return `${PAGES.pdi.href}?${new URLSearchParams({ fecha: day, proceso: props.tipo })}`
}

/**
 * Where the hora punta line sits in an hour's cell: the part of the hour that its 60 minutes
 * cover, or undefined. Where the line goes on into the next cell, it also crosses the 2px gap.
 */
function peakLine(day: DaySummary, hour: number) {
	const cellStart = hour * SEGMENTS_PER_HOUR
	const from = Math.max(day.peak.start, cellStart)
	const to = Math.min(day.peak.start + SEGMENTS_PER_HOUR, cellStart + SEGMENTS_PER_HOUR)
	if (from >= to) return undefined
	const left = (from - cellStart) / SEGMENTS_PER_HOUR * 100
	const right = (cellStart + SEGMENTS_PER_HOUR - to) / SEGMENTS_PER_HOUR * 100
	return { left: `${left}%`, right: right === 0 && to < day.peak.start + SEGMENTS_PER_HOUR ? '-2px' : `${right}%` }
}

// Hover tooltip: an extra for pointers. The numbers are already in the cells (or the table
// view), so keyboard and screen reader users don't need it. Fixed to the screen, so the scroll
// container never clips it.
const tip = ref<{ x: number, y: number, title: string, pax: number }>()

function showTip(event: PointerEvent) {
	const cell = (event.target as Element).closest<HTMLElement>('td[data-hour]')
	const day = props.days.find(d => d.day === cell?.parentElement?.dataset.day)
	if (!cell || !day) {
		tip.value = undefined
		return
	}
	const hour = Number(cell.dataset.hour)
	const rect = cell.getBoundingClientRect()
	tip.value = {
		x: rect.left + rect.width / 2,
		y: rect.top,
		title: `${formatShortDate(day.day)} · ${segmentTime(hour * SEGMENTS_PER_HOUR)}–${segmentTime((hour + 1) * SEGMENTS_PER_HOUR)}`,
		pax: day.hours[hour],
	}
}
function hideTip() {
	tip.value = undefined
}
// The tooltip doesn't follow a scrolling page; it goes away instead
onMounted(() => addEventListener('scroll', hideTip, { passive: true, capture: true }))
onBeforeUnmount(() => removeEventListener('scroll', hideTip, { capture: true }))
</script>

<template>
	<div class="-mx-4 sm:mx-0" @pointerleave="hideTip">
		<!-- The table view scrolls sideways, with the dates fixed on the left -->
		<div class="overflow-x-auto px-4 sm:px-0">
			<!--
				A real table: the caption and the row and column headers make it readable with a
				screen reader as it is. Cells are 2px apart (border-spacing), without borders.
				table-fixed: the 24 hour columns share the width equally.
			-->
			<table :class="['w-full table-fixed border-separate border-spacing-0.5 text-xs tabular-nums', { '@max-[81rem]:min-w-[72rem]': !chart }]">
				<caption class="sr-only">
					Pasajeros por hora, {{ PROCESOS[tipo] }}, {{ monthLabel }}. Al final de cada día, su total y su hora punta.
				</caption>
				<thead>
					<tr class="text-muted">
						<th scope="col" class="sticky left-0 z-10 w-15 bg-default sm:w-18">
							<span class="sr-only">Día</span>
						</th>
						<th v-for="hour in HOURS" :key="hour" scope="col" class="pb-1 font-normal">
							<!-- colors only: every third hour, so the labels don't touch -->
							<span :class="{ '@max-[81rem]:sr-only': chart && hour % 3 }">{{ String(hour).padStart(2, '0') }}</span>
						</th>
						<!-- colors only, on phones: these two columns keep their text for screen readers only -->
						<th scope="col" :class="['w-26 pb-1 pl-3 text-left font-normal', { 'max-md:w-0 max-md:pl-0': chart }]">
							<span :class="{ 'max-md:sr-only': chart }">Total</span>
						</th>
						<th scope="col" :class="['w-36 pb-1 pl-3 text-left font-normal', { 'max-md:w-0 max-md:pl-0': chart }]">
							<span :class="{ 'max-md:sr-only': chart }">Hora punta</span>
						</th>
					</tr>
				</thead>
				<tbody @pointerover="showTip">
					<tr
						v-for="(day, i) in days"
						:key="day.day"
						:data-day="day.day"
						:class="[
							// a small gap before each Monday, so the weeks show
							i > 0 && isoWeekday(day.day) === 1 && '[&>*]:border-t-4 [&>*]:border-transparent [&>*]:bg-clip-padding',
						]"
					>
						<th scope="row" class="sticky left-0 z-10 bg-default pr-1 pl-2.5 text-left font-normal whitespace-nowrap">
							<!--
								Today: "Hoy" in bold and the primary color, and a 4px bar in the left padding, like
								the current page's underline in the header
							-->
							<span v-if="day.day === todayDay" aria-hidden="true" class="absolute inset-y-0.5 left-0 w-1 rounded-full bg-primary" />
							<a
								:href="pdiLink(day.day)"
								:class="[
									'rounded-xs underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary',
									day.day === todayDay ? 'font-semibold text-primary' : 'text-toned hover:text-highlighted',
								]"
							>
								{{ dayLabel(day.day) }}
							</a>
						</th>
						<td
							v-for="hour in HOURS"
							:key="hour"
							:data-hour="hour"
							:class="[
								`heat-${heatClass(day.hours[hour])}`,
								'relative h-6 bg-(--heat) text-center text-[0.6875rem] text-(--heat-ink) hover:z-[1] hover:outline-2 hover:outline-(--ui-text-highlighted)',
							]"
						>
							<span :class="{ '@max-[81rem]:sr-only': chart }">{{ integer.format(day.hours[hour]) }}</span>
							<!-- hora punta: a line across the part of the hour its 60 minutes cover -->
							<span
								v-if="peakLine(day, hour)"
								aria-hidden="true"
								class="absolute bottom-0 h-[3px] bg-(--ui-text-highlighted) shadow-[0_-1px_0_var(--ui-bg)]"
								:style="peakLine(day, hour)"
							/>
						</td>
						<td :class="['pl-3', { 'max-md:pl-0': chart }]">
							<span :class="['flex items-center gap-1.5', { 'max-md:sr-only': chart }]">
								<!-- the same scale every month: the longest bar is the busiest day in the data -->
								<span aria-hidden="true" class="h-2 w-10 shrink-0 overflow-hidden rounded-full bg-elevated">
									<span class="block h-full rounded-full bg-[#009d9a] dark:bg-[#2dd4bf]" :style="{ width: `${day.total / scaleMax * 100}%` }" />
								</span>
								<span class="text-highlighted">{{ integer.format(day.total) }}</span>
							</span>
						</td>
						<td :class="['pl-3 whitespace-nowrap', { 'max-md:pl-0': chart }]">
							<span :class="{ 'max-md:sr-only': chart }">
								{{ windowLabel(day.peak.start) }} <span class="text-muted">({{ integer.format(day.peak.pax) }})</span>
							</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div
			v-if="tip"
			aria-hidden="true"
			class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md border border-default bg-default px-3 py-2 text-sm shadow-lg"
			:style="{ left: `${tip.x}px`, top: `${tip.y - 6}px` }"
		>
			<p class="text-xs text-muted">{{ tip.title }}</p>
			<p><b class="text-highlighted tabular-nums">{{ integer.format(tip.pax) }}</b> pasajeros</p>
		</div>
	</div>
</template>
