<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { setSelectedDay } from '../composables/selectedDay'
import { readQuery, writeQuery } from '../composables/urlQuery'
import { defaultDay, formatMonth, formatWeekdayAndDay, groupByDay } from '../data/days'
import { monthHighlights, monthsOf, summarizeMonth } from '../data/monthly'
import { windowLabel } from '../data/segments'
import { isTipo, PROCESOS, type PaxRow, type Tipo } from '../data/types'
import { TABS_UI } from '../lib/controls'
import { HEAT_LABELS } from '../lib/heat'
import MonthPicker from './MonthPicker.vue'
import PaxHeatmap from './PaxHeatmap.vue'

const props = defineProps<{ rows: PaxRow[] }>()

const byDay = computed(() => groupByDay(props.rows))
const allDays = computed(() => [...byDay.value.keys()].sort())
const months = computed(() => monthsOf(allDays.value))
/** Today, or the latest day when today has no data (see defaultDay) */
const fallbackDay = computed(() => defaultDay(allDays.value))

// Local UI state. The process can come from the URL.
const urlTipo = readQuery('proceso')
const tipo = ref<Tipo>(isTipo(urlTipo) ? urlTipo : 'llegada')

/*
  The page shows a month, but it keeps a day: the one the links to the other pages carry (see
  selectedDay.ts). It's the day a link brought (?fecha=), until the month changes; then the
  month's first day, or today in the current month.
*/
const day = ref('')
const month = computed({
	get: () => day.value.slice(0, 7),
	set: (value: string) => { day.value = firstDayOf(value) },
})

/** A month's first day with data, or today in the current month. */
function firstDayOf(value: string): string {
	if (fallbackDay.value.startsWith(value)) return fallbackDay.value
	return allDays.value.find(d => d.startsWith(value)) ?? fallbackDay.value
}

// Choose the day once the days are known: the URL's month (?mes=, with the URL's day if it's in
// that month), else the URL's day, else today (or the latest day).
watch(allDays, list => {
	if (list.includes(day.value)) return
	const wantedMonth = readQuery('mes')
	const wantedDay = defaultDay(list, readQuery('fecha'))
	day.value = wantedMonth && months.value.includes(wantedMonth) && !wantedDay.startsWith(wantedMonth)
		? firstDayOf(wantedMonth)
		: wantedDay
}, { immediate: true })

watch(day, (newDay, oldDay) => {
	setSelectedDay(newDay, fallbackDay.value)
	// The user's month goes in the URL, but not the default one (as with the day on PDI), and
	// the day a link brought goes out of it: it was in the month that's gone
	if (!oldDay) return
	const newMonth = newDay.slice(0, 7)
	writeQuery({ mes: newMonth === fallbackDay.value.slice(0, 7) ? null : newMonth, fecha: null })
}, { immediate: true })

// Keep the user's process in the URL too
watch(tipo, value => writeQuery({ proceso: value }))

const days = computed(() => summarizeMonth(byDay.value, month.value, tipo.value))
const highlights = computed(() => days.value.length ? monthHighlights(days.value) : undefined)

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
const monthLong = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' })
/** 'YYYY-MM' → 'octubre de 2026' */
const monthText = (value: string) => monthLong.format(Date.parse(`${value}-01T00:00:00Z`))

const tipoTabs = (Object.keys(PROCESOS) as Tipo[]).map(value => ({ label: PROCESOS[value], value }))
</script>

<template>
	<!-- Edge to edge on phones, a rounded card from `sm` up, like PDI -->
	<section class="border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x" aria-labelledby="monthly-title">
		<!-- Title and filters, separated from the results by a divider -->
		<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
			<div>
				<p class="text-xs font-bold tracking-widest text-primary uppercase">Vista mensual</p>
				<h2 id="monthly-title" class="mt-1 text-xl font-bold text-highlighted">{{ PROCESOS[tipo] }}</h2>
				<!-- on phones the month picker below already shows the month -->
				<p v-if="month" class="mt-0.5 text-sm text-muted first-letter:uppercase max-sm:hidden">{{ monthText(month) }}</p>
			</div>

			<!-- USWDS forms: related controls in a fieldset, with a visible legend as the label -->
			<div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-6">
				<fieldset>
					<legend class="mb-1.5 text-sm font-medium text-toned">Proceso</legend>
					<UTabs v-model="tipo" :items="tipoTabs" :content="false" :ui="TABS_UI" />
				</fieldset>
				<MonthPicker v-if="month" v-model="month" :months="months" />
			</div>
		</div>

		<div v-if="highlights" class="p-4 sm:p-6">
			<!--
				The month's takeaways, in text as USWDS asks of data visualizations: two cards, each
				with what it is, when, and how many passengers. The table marks the same two in bold.
				A description list (not headings): the table and notes below don't belong to them.
				Side by side from md: the longest value ("Miércoles 23, 02:30–03:30") is 310px wide.
			-->
			<dl class="grid max-w-3xl gap-3 md:grid-cols-2 md:gap-4">
				<div class="rounded-lg border border-default p-4">
					<dt class="text-sm font-medium text-toned">Día con más pasajeros del mes</dt>
					<dd class="mt-1 text-2xl/8 font-semibold text-highlighted first-letter:uppercase">
						{{ formatWeekdayAndDay(highlights.busiestDay.day) }}
					</dd>
					<dd class="text-toned">
						<span class="font-semibold text-highlighted">{{ integer.format(highlights.busiestDay.total) }}</span> pasajeros
					</dd>
				</div>
				<div class="rounded-lg border border-default p-4">
					<!-- the busiest 60 minutes in a row: the Hora punta column's, at its highest -->
					<dt class="text-sm font-medium text-toned">Hora con más pasajeros</dt>
					<dd class="mt-1 text-2xl/8 font-semibold text-balance text-highlighted first-letter:uppercase">
						{{ formatWeekdayAndDay(highlights.peakDay.day) }}, {{ windowLabel(highlights.peakDay.peak.start) }}
					</dd>
					<dd class="text-toned">
						<span class="font-semibold text-highlighted">{{ integer.format(highlights.peakDay.peak.pax) }}</span> pasajeros
					</dd>
				</div>
			</dl>

			<!-- Color legend: what each class means, above the grid -->
			<div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-toned">
				<span class="font-medium">Pasajeros por hora</span>
				<ul class="flex flex-wrap gap-x-4 gap-y-1.5">
					<li v-for="(label, i) in HEAT_LABELS" :key="label" class="flex items-center gap-1.5 tabular-nums">
						<span :class="[`heat-${i}`, 'size-3.5 rounded-xs bg-(--heat)']" />
						{{ label }}
					</li>
				</ul>
			</div>

			<PaxHeatmap
				:days="days"
				:tipo="tipo"
				:month-label="formatMonth(month)"
				:busiest-day="highlights.busiestDay.day"
				:peak-day="highlights.peakDay.day"
				class="mt-5"
			/>

			<!-- Each mark in the table, explained beside the same mark, centered on the first line -->
			<p class="mt-4 flex items-start gap-2 text-sm text-toned">
				<span aria-hidden="true" class="relative mt-1.5 h-2 w-6 shrink-0">
					<span class="absolute inset-x-0 top-[3px] h-0.5 rounded-full bg-accented" />
					<span class="absolute top-0 left-2 size-2 rounded-full bg-[#009d9a] ring-2 ring-(--ui-bg) dark:bg-[#2dd4bf]" />
				</span>
				<span>
					<span class="font-medium">Total:</span> el punto ubica el día entre el de menos pasajeros del mes (a la
					izquierda) y el de más (a la derecha).
				</span>
			</p>
			<p class="mt-1 flex items-start gap-2 text-sm text-toned">
				<span aria-hidden="true" class="mt-2 h-[3px] w-6 shrink-0 bg-(--ui-text-highlighted)" />
				<span><span class="font-medium">Hora punta:</span> los 60 minutos seguidos con más pasajeros del día.</span>
			</p>
			<p class="mt-1 text-sm text-muted">Cada fecha lleva a ese día en PDI.</p>
		</div>
		<p v-else class="p-4 text-sm text-muted sm:p-6">No hay datos para mostrar.</p>
	</section>
</template>
