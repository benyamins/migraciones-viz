<script setup lang="ts">
import type { AvsecHour } from '../data/avsec'

defineProps<{
	/** One day by hour (summarizeAvsecByHour). */
	hours: AvsecHour[]
}>()

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
</script>

<template>
	<section class="flex flex-col" aria-labelledby="avsec-hourly-title">
		<div class="mb-3">
			<h3 id="avsec-hourly-title" class="text-sm font-semibold text-highlighted">Resumen por hora</h3>
			<p class="text-xs text-muted">Pasajeros: total de la hora. Máquinas: máximo de la hora.</p>
		</div>

		<!-- Scrolls inside the chart's height when beside it (lg), like HourlyTable on PDI -->
		<!-- tabindex: keyboard users can focus it to scroll it -->
		<div
			tabindex="0"
			role="group"
			aria-labelledby="avsec-hourly-title"
			class="min-h-0 flex-1 rounded-xs focus-visible:outline-2 focus-visible:outline-primary lg:overflow-y-auto lg:pr-2 lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin]"
		>
			<table class="w-full text-sm tabular-nums">
				<caption class="sr-only">Resumen por hora: pasajeros totales y máximo de máquinas de cada hora</caption>
				<thead class="sticky top-0 z-10 bg-default">
					<tr class="border-b border-accented text-xs text-muted">
						<th scope="col" class="py-2 pr-2 text-left font-medium">Hora</th>
						<th scope="col" class="px-2 py-2 text-right font-medium">Pasajeros</th>
						<th scope="col" class="py-2 pl-2 text-right font-medium">Máquinas</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in hours" :key="row.hour" class="border-b border-default last:border-0 even:bg-muted/60">
						<th scope="row" class="py-1.5 pr-2 text-left font-normal text-muted">{{ row.hour }}</th>
						<td class="px-2 py-1.5 text-right">{{ integer.format(row.pax) }}</td>
						<!-- the count the rules give, in bold as on the other pages -->
						<td class="py-1.5 pl-2 text-right font-semibold text-highlighted">{{ row.maquinas ?? '–' }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>
