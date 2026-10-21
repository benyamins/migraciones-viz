<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { readQuery, writeQuery } from '../composables/urlQuery'
import { defaultDay, formatLongDate, groupByDay } from '../data/days'
import { summarizeSagByHour } from '../data/sag'
import type { PaxRow, PorticoRule, SagRule } from '../data/types'
import { TABS_UI } from '../lib/controls'
import DayPicker from './DayPicker.vue'
import SagChartSkeleton from './SagChartSkeleton.vue'
import SagHourlyTable from './SagHourlyTable.vue'

// Loaded on demand, like CapacityChart: ECharts goes into its own chunk (shared by both charts)
const SagChart = defineAsyncComponent({
	loader: () => import('./SagChart.vue'),
	loadingComponent: SagChartSkeleton,
})

const props = defineProps<{
	rows: PaxRow[]
	/** The rules from the data file, for the top of the left axis. */
	sagRules: SagRule[]
	porticoRules: PorticoRule[]
}>()

const byDay = computed(() => groupByDay(props.rows))
const days = computed(() => [...byDay.value.keys()].sort())

// Local UI state. The day can come from the URL, as on PDI.
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

// SAG inspects arrivals only: departure rows have no channels
const dayRows = computed(() => (byDay.value.get(day.value) ?? []).filter(row => row.tipo === 'llegada'))
const hours = computed(() => summarizeSagByHour(dayRows.value))

/**
 * Top of the left axis: the largest count the rules can give (4 channels today), so it stays the
 * same every day. The day's own counts only matter for a file without the rules.
 */
const maxCount = computed(() => Math.max(
	1,
	...props.sagRules.map(rule => rule.channels_open),
	...props.porticoRules.map(rule => rule.porticos),
	...hours.value.map(hour => Math.max(hour.sc + hour.k9, hour.porticos)),
))

const viewTabs = [
	{ label: 'Gráfico', value: 'chart', icon: 'i-lucide-chart-line' },
	{ label: 'Tabla', value: 'table', icon: 'i-lucide-table' },
]
</script>

<template>
	<!-- The same card as PDI (DailyView), with one filter -->
	<section
		class="border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x"
		aria-labelledby="sag-daily-title"
	>
		<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
			<div class="flex w-full flex-wrap items-start justify-between gap-4 lg:w-auto">
				<div>
					<p class="text-xs font-bold tracking-widest text-primary uppercase">Vista diaria</p>
					<h2 id="sag-daily-title" class="mt-1 text-xl font-bold text-highlighted">Llegadas</h2>
					<p v-if="day" class="mt-0.5 text-sm text-muted max-sm:hidden">{{ formatLongDate(day) }}</p>
				</div>
				<UTabs v-model="view" :items="viewTabs" :content="false" :ui="TABS_UI" class="lg:hidden" />
			</div>

			<fieldset v-if="day" class="w-full sm:w-auto">
				<legend class="mb-1.5 text-sm font-medium text-toned">Fecha</legend>
				<DayPicker v-model="day" :days="days" />
			</fieldset>
		</div>

		<!--
			Laid out as on PDI: the table (about 305px) fits the same 23rem column, so both pages
			show chart and table side by side from lg up, and the chart gets the same width.
		-->
		<div v-if="day" class="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-0">
			<SagChart
				:class="['lg:pr-6', { 'max-lg:hidden': view !== 'chart' }]"
				:rows="dayRows"
				:hours="hours"
				:day="day"
				:max-count="maxCount"
			/>
			<!-- contain-size: the table scrolls inside the chart's height (see DailyView) -->
			<div :class="['lg:border-l lg:border-default lg:pl-6 lg:contain-size', { 'max-lg:hidden': view !== 'table' }]">
				<SagHourlyTable :hours="hours" class="lg:h-full" />
			</div>
		</div>
		<p v-else class="p-4 text-sm text-muted sm:p-6">No hay datos para mostrar.</p>
	</section>
</template>
