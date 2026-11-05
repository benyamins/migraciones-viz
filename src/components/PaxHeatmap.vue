<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { pdiDayHref } from '../composables/selectedDay'
import { formatShortDate, formatShortWeekday, isoWeekday, todayInChile } from '../data/days'
import type { DaySummary } from '../data/monthly'
import { SEGMENTS_PER_HOUR, segmentTime, windowLabel } from '../data/segments'
import { PROCESOS, type Tipo } from '../data/types'
import { heatClass } from '../lib/heat'

const props = defineProps<{
	/** The month's days, in date order. */
	days: DaySummary[]
	tipo: Tipo
	/** 'octubre 2026', for the caption */
	monthLabel: string
	/**
	 * The day whose total, and the day whose hora punta, the cards above put first
	 * (monthHighlights): they're in bold here. Undefined: none in bold.
	 */
	busiestDay?: string
	peakDay?: string
}>()

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
const todayDay = todayInChile()

/** 'mié', or 'Hoy' for today: everyone knows today's weekday. */
function weekdayLabel(day: string) {
	return day === todayDay ? 'Hoy' : formatShortWeekday(day)
}

/*
  The Total column: a dot on a line that runs from the month's quietest day (left end) to its
  busiest (right end). Not bars from zero: a month's days are close in passengers, so the bars
  all came out about as long, and the busiest day didn't show.
*/
const totalRange = computed(() => {
	const totals = props.days.map(day => day.total)
	return { min: Math.min(...totals), max: Math.max(...totals) }
})

/** The dot's place on the line: 0 for the month's quietest day, 1 for its busiest. */
function dotPosition(total: number) {
	const { min, max } = totalRange.value
	return max > min ? (total - min) / (max - min) : 0.5
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

// Hover tooltip: an extra for mouse users. The numbers are already in the cells, so keyboard,
// screen reader and touch users don't need it. Fixed to the screen, so the scroll container
// never clips it.
const tip = ref<{ x: number, y: number, title: string, pax: number }>()

function showTip(event: PointerEvent) {
	// A finger covers the cell, and the tooltip would only flash until it lifts
	if (event.pointerType === 'touch') return
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
		<!--
			On cards narrower than the table it scrolls sideways, with the dates fixed on the left.
			The dates' cells cast a solid shadow in the card's color: 1rem to the left over this
			box's padding on phones, where sticky cells stop, and 2px to the right over the gap
			before the first hour, so no number shows around them as the table scrolls under.
		-->
		<div class="overflow-x-auto px-4 sm:px-0">
			<!--
				A real table: the caption and the row and column headers make it readable with a
				screen reader as it is. Cells are 2px apart (border-spacing), without borders.
				table-fixed: the 24 hour columns share the width equally. min-w: the hour cells
				stay 32px or wider, so their numbers fit.
			-->
			<table class="w-full min-w-[72rem] table-fixed border-separate border-spacing-0.5 text-xs tabular-nums">
				<caption class="sr-only">
					Pasajeros por hora, {{ PROCESOS[tipo] }}, {{ monthLabel }}. Al final de cada día, su total y su hora punta.
				</caption>
				<thead>
					<tr class="text-muted">
						<!-- the dates are links, and the header says so: phones have no hover to hint it -->
						<th scope="col" class="sticky left-0 z-10 w-16 bg-default pr-1 pb-1 pl-2.5 text-left font-normal whitespace-nowrap shadow-[-1rem_0_0_var(--ui-bg),2px_0_0_var(--ui-bg)]">
							Ir a día
						</th>
						<th v-for="hour in HOURS" :key="hour" scope="col" class="pb-1 font-normal">
							{{ String(hour).padStart(2, '0') }}
						</th>
						<th scope="col" class="w-30 pb-1 pl-3 text-left font-normal">Total</th>
						<th scope="col" class="w-36 pb-1 pl-3 text-left font-normal">Hora punta</th>
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
						<th scope="row" class="sticky left-0 z-10 bg-default pr-1 pl-2.5 font-normal whitespace-nowrap shadow-[-1rem_0_0_var(--ui-bg),2px_0_0_var(--ui-bg)]">
							<!--
								Today: "Hoy" in bold, and a 4px bar in the left padding, like the current
								page's underline in the header
							-->
							<span v-if="day.day === todayDay" aria-hidden="true" class="absolute inset-y-0.5 left-0 w-1 rounded-full bg-primary" />
							<!--
								In the link color, as USWDS links are. The weekday at the left and the day
								number at the right, so the numbers line up. The space between the two keeps
								the link's name "mié 21" for screen readers; the flex layout doesn't show it.
							-->
							<a
								:href="pdiDayHref(day.day, tipo)"
								:class="[
									'flex justify-between gap-1 rounded-xs text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary',
									{ 'font-semibold': day.day === todayDay },
								]"
							>
								<span>{{ weekdayLabel(day.day) }}</span> <span>{{ Number(day.day.slice(8, 10)) }}</span>
							</a>
						</th>
						<!--
							proportional-nums: Public Sans' tabular digits make "1.052" 35px wide, too wide
							for a 32px cell; with proportional digits it's 27px ("2.024", the largest hour
							in the data, 30px). The numbers are centered, so they don't need to line up.
						-->
						<td
							v-for="hour in HOURS"
							:key="hour"
							:data-hour="hour"
							:class="[
								`heat-${heatClass(day.hours[hour])}`,
								'relative h-6 bg-(--heat) text-center text-[0.6875rem] text-(--heat-ink) proportional-nums hover:z-[1] hover:outline-2 hover:outline-(--ui-text-highlighted)',
							]"
						>
							{{ integer.format(day.hours[hour]) }}
							<!-- hora punta: a line across the part of the hour its 60 minutes cover -->
							<span
								v-if="peakLine(day, hour)"
								aria-hidden="true"
								class="absolute bottom-0 h-[3px] bg-(--ui-text-highlighted) shadow-[0_-1px_0_var(--ui-bg)]"
								:style="peakLine(day, hour)"
							/>
						</td>
						<td class="pl-3">
							<span class="flex items-center gap-2">
								<span aria-hidden="true" class="relative h-2 w-14 shrink-0">
									<span class="absolute inset-x-0 top-[3px] h-0.5 rounded-full bg-accented" />
									<!--
										The passengers' teal, as on PDI's chart, with a 2px ring in the card's
										color so the dot stands clear of the line
									-->
									<span
										class="absolute top-0 size-2 rounded-full bg-[#009d9a] ring-2 ring-(--ui-bg) dark:bg-[#2dd4bf]"
										:style="{ left: `calc((100% - 0.5rem) * ${dotPosition(day.total)})` }"
									/>
								</span>
								<span :class="['w-11 text-right text-highlighted', { 'font-bold': day.day === busiestDay }]">
									{{ integer.format(day.total) }}
								</span>
							</span>
						</td>
						<td :class="['pl-3 whitespace-nowrap', { 'font-bold text-highlighted': day.day === peakDay }]">
							{{ windowLabel(day.peak.start) }}
							<span :class="{ 'text-muted': day.day !== peakDay }">({{ integer.format(day.peak.pax) }})</span>
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
