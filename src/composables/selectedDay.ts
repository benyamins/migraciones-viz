import { computed, ref, watch, type Ref } from 'vue'
import { defaultDay } from '../data/days'
import type { Tipo } from '../data/types'
import { PAGES, type Page } from '../site'
import { readQuery, writeQuery } from './urlQuery'

/*
  The day the user picked travels from page to page in the links (?fecha=): the header's links
  and the index's cards carry it, so PDI, Aduanas y SAG and AVSEC open on that day, and Pasajeros
  on its month. Nothing is stored in the browser: each page's URL holds its whole state, so a
  reload, a shared link or Back shows what the URL says.
*/

/**
 * The day on screen, when it isn't the default one (today, or the latest day when today has no
 * data). Undefined on the default day: the links then carry no date, and each page opens on its
 * own default, as on a first visit. It starts as the URL's, so the header's links carry it while
 * the data loads; each page then sets it.
 */
export const selectedDay = ref(readQuery('fecha') ?? undefined)

/** Sets selectedDay from the day on screen and the page's default day. */
export function setSelectedDay(day: string, defaultOne: string) {
	selectedDay.value = day === defaultOne ? undefined : day
}

/** The link to a page, carrying the selected day. */
export function pageHref(page: Page): string {
	return selectedDay.value ? `${page.href}?${new URLSearchParams({ fecha: selectedDay.value })}` : page.href
}

/** The link to a day on PDI, for the index's dates (its cards and table): the details are there. */
export function pdiDayHref(day: string, tipo: Tipo): string {
	return `${PAGES.pdi.href}?${new URLSearchParams({ fecha: day, proceso: tipo })}`
}

/**
 * The day a daily page (PDI, Aduanas y SAG, AVSEC) shows: the URL's, else the default one (see
 * defaultDay). The user's changes go in the URL and in selectedDay.
 */
export function usePageDay(days: Ref<string[]>): Ref<string> {
	const day = ref('')
	const fallback = computed(() => defaultDay(days.value))

	// Choose the day once the days are known
	watch(days, list => {
		if (!list.includes(day.value)) day.value = defaultDay(list, readQuery('fecha'))
	}, { immediate: true })

	watch(day, (newDay, oldDay) => {
		setSelectedDay(newDay, fallback.value)
		// Not the first day the page chose, and never the default day: a link without a date
		// keeps opening today's
		if (oldDay) writeQuery({ fecha: newDay === fallback.value ? null : newDay })
	}, { immediate: true })

	return day
}
