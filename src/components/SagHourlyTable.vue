<script setup lang="ts">
import type { SagHour } from '../data/sag'

defineProps<{
	/** One day by hour (summarizeSagByHour). */
	hours: SagHour[]
}>()

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
</script>

<template>
	<section class="flex flex-col" aria-labelledby="sag-hourly-title">
		<div class="mb-3">
			<h3 id="sag-hourly-title" class="text-sm font-semibold text-highlighted">Resumen por hora</h3>
			<p class="text-xs text-muted">Pasajeros: total de la hora. Canales y pórticos: según los 60 minutos con más pasajeros en torno a esa hora.</p>
		</div>

		<!-- Scrolls inside the chart's height when beside it (lg), like HourlyTable on PDI -->
		<!-- tabindex: keyboard users can focus it to scroll it -->
		<div
			tabindex="0"
			role="group"
			aria-labelledby="sag-hourly-title"
			class="min-h-0 flex-1 rounded-xs focus-visible:outline-2 focus-visible:outline-primary lg:overflow-y-auto lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin]"
		>
			<table class="w-full text-sm tabular-nums">
				<caption class="sr-only">
					Resumen por hora: pasajeros de la hora, los canales SC y K9, el total de canales y los pórticos
				</caption>
				<thead class="sticky top-0 z-10 bg-default">
					<tr class="border-b border-accented text-xs text-muted">
						<th scope="col" class="py-2 pr-1 text-left font-medium sm:pr-2">Hora</th>
						<th scope="col" class="px-1 py-2 text-right font-medium sm:px-2">Pasajeros</th>
						<th scope="col" class="px-1 py-2 text-right font-medium sm:px-2">SC</th>
						<th scope="col" class="px-1 py-2 text-right font-medium sm:px-2">K9</th>
						<th scope="col" class="px-1 py-2 text-right font-medium sm:px-2">Canales</th>
						<th scope="col" class="py-2 pl-1 text-right font-medium sm:pl-2">Pórticos</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in hours" :key="row.hour" class="border-b border-default last:border-0 even:bg-muted/60">
						<th scope="row" class="py-1.5 pr-1 text-left font-normal text-muted sm:pr-2">{{ row.hour }}</th>
						<td class="px-1 py-1.5 text-right sm:px-2">{{ integer.format(row.pax) }}</td>
						<td class="px-1 py-1.5 text-right sm:px-2">{{ row.sc }}</td>
						<td class="px-1 py-1.5 text-right sm:px-2">{{ row.k9 }}</td>
						<!-- the two counts the rules give, in bold -->
						<td class="px-1 py-1.5 text-right font-semibold text-highlighted sm:px-2">{{ row.sc + row.k9 }}</td>
						<td class="py-1.5 pl-1 text-right font-semibold text-highlighted sm:pl-2">{{ row.porticos }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>
