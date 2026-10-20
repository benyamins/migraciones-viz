<script setup lang="ts">
import { computed } from 'vue'
import { formatMonth } from '../data/days'

const props = defineProps<{
	/** Months that have data, sorted ('YYYY-MM'). Must not be empty. */
	months: string[]
}>()

/** The selected month ('YYYY-MM'). The parent binds it with v-model. */
const month = defineModel<string>({ required: true })

const index = computed(() => props.months.indexOf(month.value))
const items = computed(() => props.months.map(value => ({ label: formatMonth(value), value })))

/** Jump to the previous/next month that has data, skipping gaps (e.g. March). */
function move(offset: number) {
	const next = props.months[index.value + offset]
	if (next) month.value = next
}
</script>

<template>
	<!-- Same look and sizes as DayPicker: arrows around a 40px control (44px on phones) -->
	<div class="flex items-center gap-1.5">
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
			v-model="month"
			:items="items"
			icon="i-lucide-calendar"
			color="neutral"
			variant="outline"
			aria-label="Mes"
			class="h-10 flex-1 max-sm:h-11 sm:w-44 sm:flex-none"
		/>
		<UButton
			icon="i-lucide-chevron-right"
			color="neutral"
			variant="outline"
			aria-label="Mes siguiente con datos"
			class="size-10 justify-center max-sm:size-11"
			:disabled="index >= months.length - 1"
			@click="move(1)"
		/>
	</div>
</template>
