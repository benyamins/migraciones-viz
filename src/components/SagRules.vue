<script setup lang="ts">
import type { SagRule } from '../data/types'

defineProps<{
	/** From the data file's metadata: the capacidad_aduanas_sag sheet, as prepare.sql applied it. */
	rules: SagRule[]
}>()

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

/** '401–1.200', or '2.501 o más' for the last range */
function range(rule: SagRule) {
	return rule.pax_max === null
		? `${integer.format(rule.pax_min)} o más`
		: `${integer.format(rule.pax_min)}–${integer.format(rule.pax_max)}`
}
</script>

<template>
	<!-- The text and its table side by side from lg up -->
	<section
		class="grid items-start gap-x-12 gap-y-4 border-y border-default bg-default p-4 shadow-xs sm:rounded-lg sm:border-x sm:p-6 lg:grid-cols-[minmax(0,36rem)_auto]"
		aria-labelledby="sag-rules-title"
	>
		<div>
			<h2 id="sag-rules-title" class="text-lg font-bold text-highlighted">Cómo se calcula</h2>
			<p class="mt-1 text-sm text-pretty text-toned">
				Para cada hora se toma el tramo de 60 minutos seguidos con más pasajeros que pasa al menos
				media hora dentro de ella. Sus pasajeros definen los canales de la hora, según esta tabla.
			</p>
		</div>
		<table class="justify-self-start text-sm tabular-nums">
			<caption class="sr-only">Canales SC y K9 según los pasajeros en 60 minutos</caption>
			<thead>
				<tr class="border-b border-accented text-xs text-muted">
					<th scope="col" class="py-2 pr-6 text-left font-medium">Pasajeros por hora</th>
					<th scope="col" class="px-3 py-2 text-right font-medium">Canales</th>
					<th scope="col" class="px-3 py-2 text-right font-medium">SC</th>
					<th scope="col" class="py-2 pl-3 text-right font-medium">K9</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="rule in rules" :key="rule.pax_min" class="border-b border-default last:border-0">
					<th scope="row" class="py-1.5 pr-6 text-left font-normal">{{ range(rule) }}</th>
					<td class="px-3 py-1.5 text-right font-semibold text-highlighted">{{ rule.channels_open }}</td>
					<td class="px-3 py-1.5 text-right">{{ rule.sc_channels }}</td>
					<td class="py-1.5 pl-3 text-right">{{ rule.k9_channels }}</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>
