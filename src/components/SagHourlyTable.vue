<script setup lang="ts">
import type { SagHour } from '../data/sag'
import { windowLabel } from '../data/segments'

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
			<p class="text-xs text-muted">Pasajeros: total de la hora. Máx. 60 min: el tramo que define sus canales.</p>
		</div>

		<!-- Scrolls inside the chart's height when beside it (xl), like HourlyTable on Casetas -->
		<!-- tabindex: keyboard users can focus it to scroll it -->
		<div
			tabindex="0"
			role="group"
			aria-labelledby="sag-hourly-title"
			class="min-h-0 flex-1 rounded-xs focus-visible:outline-2 focus-visible:outline-primary xl:overflow-y-auto xl:[scrollbar-gutter:stable] xl:[scrollbar-width:thin]"
		>
			<table class="w-full text-sm tabular-nums">
				<caption class="sr-only">
					Resumen por hora: pasajeros de la hora, los 60 minutos con más pasajeros que definen sus canales, y los canales SC y K9
				</caption>
				<thead class="sticky top-0 z-10 bg-default">
					<tr class="border-b border-accented text-xs text-muted">
						<th scope="col" class="py-2 pr-2 text-left font-medium">Hora</th>
						<th scope="col" class="px-2 py-2 text-right font-medium">Pasajeros</th>
						<th scope="col" class="px-2 py-2 text-right font-medium">Máx. 60 min</th>
						<th scope="col" class="px-2 py-2 text-right font-medium">SC</th>
						<th scope="col" class="px-2 py-2 text-right font-medium">K9</th>
						<th scope="col" class="py-2 pl-2 text-right font-medium">Canales</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in hours" :key="row.hour" class="border-b border-default last:border-0 even:bg-muted/60">
						<th scope="row" class="py-1.5 pr-2 text-left font-normal text-muted">{{ row.hour }}</th>
						<td class="px-2 py-1.5 text-right">{{ integer.format(row.pax) }}</td>
						<!-- the window first and smaller, so the numbers line up on the right -->
						<td class="px-2 py-1.5 text-right whitespace-nowrap">
							<span class="text-xs text-muted">{{ windowLabel(row.peak.start) }}</span>
							{{ integer.format(row.peak.pax) }}
						</td>
						<td class="px-2 py-1.5 text-right">{{ row.sc }}</td>
						<td class="px-2 py-1.5 text-right">{{ row.k9 }}</td>
						<td class="py-1.5 pl-2 text-right font-semibold text-highlighted">{{ row.sc + row.k9 }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>
