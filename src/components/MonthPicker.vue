<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { formatMonth, formatShortMonth, todayInChile } from '../data/days'
import TodayButton from './TodayButton.vue'

const props = defineProps<{
	/** Months that have data, sorted ('YYYY-MM'). Must not be empty. */
	months: string[]
}>()

/** The selected month ('YYYY-MM'). The parent binds it with v-model. */
const month = defineModel<string>({ required: true })

const index = computed(() => props.months.indexOf(month.value))
const items = computed(() => props.months.map(value => ({ label: formatMonth(value), value })))
const currentMonth = todayInChile().slice(0, 7)

/** Jump to the previous/next month that has data, skipping gaps (e.g. March). */
function move(offset: number) {
	const next = props.months[index.value + offset]
	if (next) month.value = next
}

// As on DayPicker: "Hoy" is disabled once it's used, so the focus moves to the month
const select = useTemplateRef<{ triggerRef?: HTMLElement }>('select')
function goToday() {
	month.value = currentMonth
	select.value?.triggerRef?.focus()
}
</script>

<template>
	<!--
		Same look and sizes as DayPicker: arrows around a 40px control (44px on phones), then "Hoy",
		which goes on a line of its own on phones under 336px wide
	-->
	<fieldset>
		<legend class="mb-1.5 text-sm font-medium text-toned">Mes</legend>
		<div class="flex flex-wrap items-center gap-1.5">
			<UButton
				icon="i-lucide-chevron-left"
				color="neutral"
				variant="outline"
				aria-label="Mes anterior con datos"
				class="size-10 justify-center max-sm:size-11"
				:disabled="index <= 0"
				@click="move(-1)"
			/>
			<USelect
				ref="select"
				v-model="month"
				:items="items"
				icon="i-lucide-calendar"
				color="neutral"
				variant="outline"
				aria-label="Mes"
				class="h-10 flex-1 max-sm:h-11 sm:w-44 sm:flex-none"
			>
				<!--
					On phones the short month ("sept 2026"), as the date picker shows "13 nov 2026": with
					"septiembre 2026", "Hoy" didn't fit in the row under 390px. The list keeps the full
					names.
				-->
				<span class="sm:hidden">{{ formatShortMonth(month) }}</span>
				<span class="max-sm:hidden">{{ formatMonth(month) }}</span>
			</USelect>
			<UButton
				icon="i-lucide-chevron-right"
				color="neutral"
				variant="outline"
				aria-label="Mes siguiente con datos"
				class="size-10 justify-center max-sm:size-11"
				:disabled="index >= months.length - 1"
				@click="move(1)"
			/>
			<TodayButton v-if="months.includes(currentMonth)" :disabled="month === currentMonth" @click="goToday" />
		</div>
	</fieldset>
</template>
