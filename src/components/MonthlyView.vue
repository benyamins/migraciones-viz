<script setup lang="ts">
import { today } from '@internationalized/date'
import { computed, ref, watch } from 'vue'
import { readQuery, writeQuery } from '../composables/urlQuery'
import { formatMonth, formatWeekdayAndDay, groupByDay } from '../data/days'
import { monthHighlights, monthsOf, summarizeMonth } from '../data/monthly'
import { tenths, wholePax } from '../data/pax'
import { segmentTime, SEGMENTS_PER_HOUR } from '../data/segments'
import { isTipo, PROCESOS, type PaxRow, type Tipo } from '../data/types'
import { TABS_UI } from '../lib/controls'
import { HEAT_LABELS } from '../lib/heat'
import MonthPicker from './MonthPicker.vue'
import PaxHeatmap from './PaxHeatmap.vue'

const props = defineProps<{ rows: PaxRow[] }>()

const byDay = computed(() => groupByDay(props.rows))
const months = computed(() => monthsOf([...byDay.value.keys()]))

// Local UI state. The process and the month can come from the URL.
const urlTipo = readQuery('proceso')
const tipo = ref<Tipo>(isTipo(urlTipo) ? urlTipo : 'llegada')
const month = ref('')
/**
 * On a card narrower than 81rem the numbers don't fit in the cells: colors only, or the table
 * with the numbers (see PaxHeatmap). 81rem: 24 hour columns of 36px, plus the other columns.
 */
const view = ref<'chart' | 'table'>('chart')

// Choose the month once the months are known: the URL's, else the current one (in Chile) if it
// has data, else the latest.
watch(months, list => {
	if (list.includes(month.value)) return
	const wanted = readQuery('mes')
	const now = today('America/Santiago').toString().slice(0, 7)
	month.value = wanted && list.includes(wanted) ? wanted : list.includes(now) ? now : list[list.length - 1] ?? ''
}, { immediate: true })

// Keep the user's choices in the URL, as on Casetas (not the first default month)
watch([month, tipo], ([newMonth, newTipo], [oldMonth]) => {
	if (oldMonth) writeQuery({ mes: newMonth, proceso: newTipo })
})

const days = computed(() => summarizeMonth(byDay.value, month.value, tipo.value))
const highlights = computed(() => days.value.length ? monthHighlights(days.value) : undefined)

// The longest Total bar is the busiest day in the file, either process: the same scale every month
const scaleMax = computed(() => {
	const totals = new Map<string, number>()
	for (const row of props.rows) {
		const key = `${row.dt_segmento.slice(0, 10)} ${row.tipo}`
		totals.set(key, (totals.get(key) ?? 0) + tenths(row.pax))
	}
	return wholePax(Math.max(...totals.values()))
})

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
const monthLong = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' })
/** 'YYYY-MM' → 'octubre de 2026' */
const monthText = (value: string) => monthLong.format(Date.parse(`${value}-01T00:00:00Z`))

const tipoTabs = (Object.keys(PROCESOS) as Tipo[]).map(value => ({ label: PROCESOS[value], value }))
const viewTabs = [
	{ label: 'Gráfico', value: 'chart', icon: 'i-lucide-grid-3x3' },
	{ label: 'Tabla', value: 'table', icon: 'i-lucide-table' },
]
</script>

<template>
	<!--
		Edge to edge on phones, a rounded card from `sm` up, like Casetas. @container: the
		heatmap's views depend on the card's width (@min-[81rem] and @max-[81rem]).
	-->
	<section
		class="@container border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x"
		aria-labelledby="monthly-title"
	>
		<!-- Title and filters, separated from the results by a divider -->
		<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
			<div class="flex w-full flex-wrap items-start justify-between gap-4 @min-[81rem]:w-auto">
				<div>
					<p class="text-xs font-bold tracking-widest text-primary uppercase">Vista mensual</p>
					<h2 id="monthly-title" class="mt-1 text-xl font-bold text-highlighted">{{ PROCESOS[tipo] }}</h2>
					<!-- on phones the month picker below already shows the month -->
					<p v-if="month" class="mt-0.5 text-sm text-muted first-letter:uppercase max-sm:hidden">{{ monthText(month) }}</p>
				</div>
				<UTabs v-model="view" :items="viewTabs" :content="false" :ui="TABS_UI" class="@min-[81rem]:hidden" />
			</div>

			<!-- USWDS forms: related controls in a fieldset, with a visible legend as the label -->
			<div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-6">
				<fieldset>
					<legend class="mb-1.5 text-sm font-medium text-toned">Proceso</legend>
					<UTabs v-model="tipo" :items="tipoTabs" :content="false" :ui="TABS_UI" />
				</fieldset>
				<fieldset v-if="month">
					<legend class="mb-1.5 text-sm font-medium text-toned">Mes</legend>
					<MonthPicker v-model="month" :months="months" />
				</fieldset>
			</div>
		</div>

		<div v-if="highlights" class="p-4 sm:p-6">
			<!-- USWDS data visualizations: state the takeaway in plain text -->
			<p class="max-w-4xl text-pretty text-toned">
				En {{ monthText(month) }}, los 60 minutos con más pasajeros son el
				<strong class="font-semibold text-highlighted">
					{{ formatWeekdayAndDay(highlights.peakDay.day) }}, de {{ segmentTime(highlights.peakDay.peak.start) }}
					a {{ segmentTime(highlights.peakDay.peak.start + SEGMENTS_PER_HOUR) }}
				</strong>
				({{ integer.format(highlights.peakDay.peak.pax) }}). El día con más pasajeros es el
				<strong class="font-semibold text-highlighted">{{ formatWeekdayAndDay(highlights.busiestDay.day) }}</strong>
				({{ integer.format(highlights.busiestDay.total) }}).
			</p>

			<!-- Color legend: what each class means, above the grid -->
			<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-toned">
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
				:view="view"
				:scale-max="scaleMax"
				class="mt-5"
			/>

			<p class="mt-4 flex items-center gap-2 text-sm text-toned">
				<!-- the same mark as under the rows -->
				<span aria-hidden="true" class="h-[3px] w-6 shrink-0 bg-(--ui-text-highlighted)" />
				<span><span class="font-medium">Hora punta:</span> los 60 minutos seguidos con más pasajeros del día.</span>
			</p>
			<p class="mt-1 text-sm text-muted">Cada fecha lleva a sus casetas de ese día.</p>
		</div>
		<p v-else class="p-4 text-sm text-muted sm:p-6">No hay datos para mostrar.</p>
	</section>
</template>
