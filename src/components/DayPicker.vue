<script setup lang="ts">
import { parseDate, toCalendarDate, type DateValue } from '@internationalized/date'
import { computed, ref, useTemplateRef } from 'vue'
import { formatShortDate, todayInChile } from '../data/days'
import TodayButton from './TodayButton.vue'

const props = defineProps<{
	/** Days that have data, sorted ('YYYY-MM-DD'). Must not be empty. */
	days: string[]
}>()

/** The selected day ('YYYY-MM-DD'). The parent binds it with v-model. */
const day = defineModel<string>({ required: true })

const open = ref(false)
const index = computed(() => props.days.indexOf(day.value))
const available = computed(() => new Set(props.days))
const todayDay = todayInChile()

/** Jump to the previous/next day that has data, skipping gaps (e.g. March). */
function move(offset: number) {
	const next = props.days[index.value + offset]
	if (next) day.value = next
}

// "Hoy" is disabled once it's used (as the arrows are at the ends), so the focus moves to the
// date, which now shows today: without that, keyboard users would be sent back to the top of the page
const dateButton = useTemplateRef<{ $el: HTMLElement }>('dateButton')
function goToday() {
	day.value = todayDay
	dateButton.value?.$el.focus()
}

// UCalendar works with @internationalized/date objects; we keep plain strings
// everywhere else, so convert at this boundary with a writable computed.
const calendarDay = computed({
	get: () => parseDate(day.value),
	set: (value: DateValue | undefined) => {
		if (!value) return
		day.value = toCalendarDate(value).toString()
		open.value = false
	},
})
const minDay = computed(() => parseDate(props.days[0]))
const maxDay = computed(() => parseDate(props.days[props.days.length - 1]))

const isDisabled = (date: DateValue) => !available.value.has(date.toString())
</script>

<template>
	<!--
		USWDS forms: the controls in a fieldset, with a visible legend as the label. "Hoy" (see
		TodayButton) comes last, and only when today has data. flex-wrap: on phones under 352px
		wide, where the four don't fit, it goes on a line of its own.
	-->
	<fieldset>
		<legend class="mb-1.5 text-sm font-medium text-toned">Fecha</legend>
		<div class="flex flex-wrap items-center gap-1.5">
			<UButton
				icon="i-lucide-chevron-left"
				color="neutral"
				variant="outline"
				aria-label="Día anterior con datos"
				class="size-10 justify-center max-sm:size-11"
				:disabled="index <= 0"
				@click="move(-1)"
			/>

			<UPopover v-model:open="open">
				<UButton
					ref="dateButton"
					icon="i-lucide-calendar"
					color="neutral"
					variant="outline"
					:label="formatShortDate(day)"
					class="h-10 flex-1 justify-center max-sm:h-11 sm:w-44 sm:flex-none"
				/>
				<template #content>
					<UCalendar
						v-model="calendarDay"
						:min-value="minDay"
						:max-value="maxDay"
						:is-date-disabled="isDisabled"
						class="p-2"
					/>
				</template>
			</UPopover>

			<UButton
				icon="i-lucide-chevron-right"
				color="neutral"
				variant="outline"
				aria-label="Día siguiente con datos"
				class="size-10 justify-center max-sm:size-11"
				:disabled="index >= days.length - 1"
				@click="move(1)"
			/>
			<TodayButton v-if="available.has(todayDay)" :disabled="day === todayDay" @click="goToday" />
		</div>
	</fieldset>
</template>
