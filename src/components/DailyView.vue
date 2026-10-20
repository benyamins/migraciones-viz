<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { readQuery, writeQuery } from '../composables/urlQuery'
import { defaultDay, formatLongDate, groupByDay } from '../data/days'
import { isTipo, PROCESOS, type PaxRow, type Tipo } from '../data/types'
import { TABS_UI } from '../lib/controls'
import ChartSkeleton from './ChartSkeleton.vue'
import DayPicker from './DayPicker.vue'
import HourlyTable from './HourlyTable.vue'

// Loaded on demand: ECharts (~170 KB gzipped) goes into its own chunk, which downloads
// while the data loads. If the data wins the race, the skeleton holds the chart's place.
const CapacityChart = defineAsyncComponent({
	loader: () => import('./CapacityChart.vue'),
	loadingComponent: ChartSkeleton,
})

const props = defineProps<{ rows: PaxRow[] }>()

// Derived state: computed values update automatically when props.rows changes.
const byDay = computed(() => groupByDay(props.rows))
const days = computed(() => [...byDay.value.keys()].sort())

// Local UI state. The process and the day can come from the URL (links from the index).
const urlTipo = readQuery('proceso')
const tipo = ref<Tipo>(isTipo(urlTipo) ? urlTipo : 'llegada')
const day = ref('')
/** Below `lg` only one of chart/table is shown at a time; wide screens show both. */
const view = ref<'chart' | 'table'>('chart')

// Choose the day once the days are known: the URL's, else today's or the latest (see defaultDay).
watch(days, list => {
	if (!list.includes(day.value)) day.value = defaultDay(list, readQuery('fecha'))
}, { immediate: true })

// Keep the user's choices in the URL. Not the first default day: a link saved without a date
// keeps opening today's.
watch([day, tipo], ([newDay, newTipo], [oldDay]) => {
	if (oldDay) writeQuery({ fecha: newDay, proceso: newTipo })
})

const dayRows = computed(() =>
	(byDay.value.get(day.value) ?? []).filter(row => row.tipo === tipo.value),
)

const tipoTabs = (Object.keys(PROCESOS) as Tipo[]).map(value => ({ label: PROCESOS[value], value }))
const viewTabs = [
	{ label: 'Gráfico', value: 'chart', icon: 'i-lucide-chart-line' },
	{ label: 'Tabla', value: 'table', icon: 'i-lucide-table' },
]
</script>

<template>
	<!-- Edge to edge on phones (more room for the chart), a rounded card from `sm` up -->
	<section
		class="border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x"
		aria-labelledby="daily-title"
	>
		<!-- Title and filters, separated from the results by a divider -->
		<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
			<!-- flex-wrap: on very narrow phones (under ~350px) the view switch drops below the title -->
			<div class="flex w-full flex-wrap items-start justify-between gap-4 lg:w-auto">
				<div>
					<p class="text-xs font-bold tracking-widest text-primary uppercase">Vista diaria</p>
					<h2 id="daily-title" class="mt-1 text-xl font-bold text-highlighted">{{ PROCESOS[tipo] }}</h2>
					<!-- on phones the date picker below already shows the date -->
					<p v-if="day" class="mt-0.5 text-sm text-muted max-sm:hidden">{{ formatLongDate(day) }}</p>
				</div>
				<UTabs v-model="view" :items="viewTabs" :content="false" :ui="TABS_UI" class="lg:hidden" />
			</div>

			<!-- USWDS forms: related controls in a fieldset, with a visible legend as the label -->
			<div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-6">
				<fieldset>
					<legend class="mb-1.5 text-sm font-medium text-toned">Proceso</legend>
					<UTabs v-model="tipo" :items="tipoTabs" :content="false" :ui="TABS_UI" />
				</fieldset>
				<fieldset v-if="day">
					<legend class="mb-1.5 text-sm font-medium text-toned">Fecha</legend>
					<DayPicker v-model="day" :days="days" />
				</fieldset>
			</div>
		</div>

		<div v-if="day" class="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-0">
			<!-- `max-lg:hidden` hides only below lg, so wide screens always show both -->
			<CapacityChart
				:class="['lg:pr-6', { 'max-lg:hidden': view !== 'chart' }]"
				:rows="dayRows"
				:day="day"
				:proceso="PROCESOS[tipo]"
			/>
			<!--
				contain-size: this column doesn't add its own height to the grid row, so the row is
				as tall as the chart, and the table scrolls inside that height (see HourlyTable).
			-->
			<div :class="['lg:border-l lg:border-default lg:pl-6 lg:contain-size', { 'max-lg:hidden': view !== 'table' }]">
				<HourlyTable :rows="dayRows" class="lg:h-full" />
			</div>
		</div>
		<p v-else class="p-4 text-sm text-muted sm:p-6">No hay datos para mostrar.</p>
	</section>
</template>
