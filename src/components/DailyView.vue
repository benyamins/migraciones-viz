<script setup lang="ts">
import { today } from '@internationalized/date'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { formatLongDate, groupByDay } from '../data/days'
import { PROCESOS, type PaxRow, type Tipo } from '../data/types'
import DayPicker from './DayPicker.vue'
import HourlyTable from './HourlyTable.vue'

// Loaded on demand: ECharts (~170 KB gzipped) goes into its own chunk, which downloads
// while the data loads instead of delaying the first render.
const CapacityChart = defineAsyncComponent(() => import('./CapacityChart.vue'))

const props = defineProps<{ rows: PaxRow[] }>()

// Derived state: computed values update automatically when props.rows changes.
const byDay = computed(() => groupByDay(props.rows))
const days = computed(() => [...byDay.value.keys()].sort())

// Local UI state.
const tipo = ref<Tipo>('llegada')
const day = ref('')
/** Below `lg` only one of chart/table is shown at a time; wide screens show both. */
const view = ref<'chart' | 'table'>('chart')

// Choose a default day once the days are known: today (in Chile) if it has data, else the latest day.
watch(days, list => {
	if (list.includes(day.value)) return
	const now = today('America/Santiago').toString()
	day.value = list.includes(now) ? now : list[list.length - 1] ?? ''
}, { immediate: true })

const dayRows = computed(() =>
	(byDay.value.get(day.value) ?? []).filter(row => row.tipo === tipo.value),
)

const tipoTabs = (Object.keys(PROCESOS) as Tipo[]).map(value => ({ label: PROCESOS[value], value }))
const viewTabs = [
	{ label: 'Gráfico', value: 'chart', icon: 'i-lucide-chart-line' },
	{ label: 'Tabla', value: 'table', icon: 'i-lucide-table' },
]
// taller segments on phones: easier to hit with a thumb
const tabsUi = { trigger: 'max-sm:min-h-10' }
</script>

<template>
	<!-- Edge to edge on phones (more room for the chart), a rounded card from `sm` up -->
	<section
		class="border-y border-default bg-default p-4 shadow-xs sm:rounded-lg sm:border-x sm:p-6"
		aria-labelledby="daily-title"
	>
		<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
			<div class="flex w-full items-start justify-between gap-4 sm:w-auto">
				<div>
					<p class="text-xs font-bold tracking-widest text-primary uppercase">Vista diaria</p>
					<h2 id="daily-title" class="mt-1 text-xl font-bold text-highlighted">{{ PROCESOS[tipo] }}</h2>
					<!-- on phones the date picker right below already shows the date -->
					<p v-if="day" class="text-sm text-muted max-sm:hidden">{{ formatLongDate(day) }}</p>
				</div>
				<UTabs v-model="view" :items="viewTabs" :content="false" size="sm" :ui="tabsUi" class="lg:hidden" />
			</div>

			<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
				<UTabs v-model="tipo" :items="tipoTabs" :content="false" size="sm" :ui="tabsUi" />
				<DayPicker v-if="day" v-model="day" :days="days" />
			</div>
		</div>

		<div v-if="day" class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
			<!-- `max-lg:hidden` hides only below lg, so wide screens always show both -->
			<CapacityChart
				:class="{ 'max-lg:hidden': view !== 'chart' }"
				:rows="dayRows"
				:day="day"
				:proceso="PROCESOS[tipo]"
			/>
			<!-- On wide screens the table takes the chart's height and scrolls inside it -->
			<div class="relative" :class="{ 'max-lg:hidden': view !== 'table' }">
				<div class="lg:absolute lg:inset-0 lg:overflow-y-auto">
					<HourlyTable :rows="dayRows" />
				</div>
			</div>
		</div>
		<p v-else class="mt-6 text-sm text-muted">No hay datos para mostrar.</p>
	</section>
</template>
