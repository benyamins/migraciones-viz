<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { readQuery, writeQuery } from '../composables/urlQuery'
import { summarizeAvsecByHour } from '../data/avsec'
import { defaultDay, formatLongDate, groupByDay } from '../data/days'
import type { AvsecRule, PaxRow } from '../data/types'
import { TABS_UI } from '../lib/controls'
import AvsecChartSkeleton from './AvsecChartSkeleton.vue'
import AvsecHourlyTable from './AvsecHourlyTable.vue'
import DayPicker from './DayPicker.vue'

// Loaded on demand, like the other charts: ECharts goes into its own chunk (shared by all charts)
const AvsecChart = defineAsyncComponent({
	loader: () => import('./AvsecChart.vue'),
	loadingComponent: AvsecChartSkeleton,
})

const props = defineProps<{
	rows: PaxRow[]
	/** The avsec rules from the data file (see src/data/avsec.ts). */
	rules: AvsecRule[]
}>()

const byDay = computed(() => groupByDay(props.rows))
const days = computed(() => [...byDay.value.keys()].sort())

// Local UI state. The day can come from the URL, as on the other pages.
const day = ref('')
/** Below `lg` only one of chart/table is shown at a time; wide screens show both. */
const view = ref<'chart' | 'table'>('chart')

watch(days, list => {
	if (!list.includes(day.value)) day.value = defaultDay(list, readQuery('fecha'))
}, { immediate: true })

// Keep the user's choice in the URL (not the first default day, as on PDI)
watch(day, (newDay, oldDay) => {
	if (oldDay) writeQuery({ fecha: newDay })
})

// AVSEC screens departing passengers only
const dayRows = computed(() => (byDay.value.get(day.value) ?? []).filter(row => row.tipo === 'salida'))
const hours = computed(() => summarizeAvsecByHour(dayRows.value, props.rules))

const viewTabs = [
	{ label: 'Gráfico', value: 'chart', icon: 'i-lucide-chart-line' },
	{ label: 'Tabla', value: 'table', icon: 'i-lucide-table' },
]
</script>

<template>
	<!-- The same card as Aduanas y SAG (SagDailyView), for departures -->
	<section
		class="border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x"
		aria-labelledby="avsec-daily-title"
	>
		<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
			<div class="flex w-full flex-wrap items-start justify-between gap-4 lg:w-auto">
				<div>
					<p class="text-xs font-bold tracking-widest text-primary uppercase">Vista diaria</p>
					<h2 id="avsec-daily-title" class="mt-1 text-xl font-bold text-highlighted">Salidas</h2>
					<p v-if="day" class="mt-0.5 text-sm text-muted max-sm:hidden">{{ formatLongDate(day) }}</p>
				</div>
				<UTabs v-model="view" :items="viewTabs" :content="false" :ui="TABS_UI" class="lg:hidden" />
			</div>

			<fieldset v-if="day" class="w-full sm:w-auto">
				<legend class="mb-1.5 text-sm font-medium text-toned">Fecha</legend>
				<DayPicker v-model="day" :days="days" />
			</fieldset>
		</div>

		<!-- Laid out as on the other pages: chart and table side by side from lg up -->
		<div v-if="day" class="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-0">
			<AvsecChart
				:class="['lg:pr-6', { 'max-lg:hidden': view !== 'chart' }]"
				:rows="dayRows"
				:day="day"
				:rules="rules"
			/>
			<!-- contain-size: the table scrolls inside the chart's height (see DailyView) -->
			<div :class="['lg:border-l lg:border-default lg:pl-6 lg:contain-size', { 'max-lg:hidden': view !== 'table' }]">
				<AvsecHourlyTable :hours="hours" class="lg:h-full" />
			</div>
		</div>
		<p v-else class="p-4 text-sm text-muted sm:p-6">No hay datos para mostrar.</p>
	</section>
</template>
