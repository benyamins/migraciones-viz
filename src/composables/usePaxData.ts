import { shallowRef } from 'vue'
import { loadPax } from '../data/load'
import type { PaxRow, PorticoRule, SagRule } from '../data/types'

/**
 * Loads the dataset once and exposes it as reactive state.
 *
 * shallowRef instead of ref: Vue then only tracks replacing `.value`, instead of
 * wrapping each of the ~34k row objects in a reactive proxy we'd never mutate.
 */
export function usePaxData() {
	const rows = shallowRef<PaxRow[]>([])
	const updatedAt = shallowRef<Date>()
	const sagRules = shallowRef<SagRule[]>([])
	const porticoRules = shallowRef<PorticoRule[]>([])
	const loading = shallowRef(true)
	const error = shallowRef<Error>()

	loadPax()
		.then(data => {
			rows.value = data.rows
			updatedAt.value = data.updatedAt
			sagRules.value = data.sagRules
			porticoRules.value = data.porticoRules
		})
		.catch((e: unknown) => { error.value = e instanceof Error ? e : new Error(String(e)) })
		.finally(() => { loading.value = false })

	return { rows, updatedAt, sagRules, porticoRules, loading, error }
}
