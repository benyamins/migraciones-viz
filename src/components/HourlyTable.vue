<script setup lang="ts">
import { computed } from 'vue'
import { summarizeByHour } from '../data/hourly'
import type { PaxRow } from '../data/types'

const props = defineProps<{
	/** Rows of a single day and tipo, in time order. */
	rows: PaxRow[]
}>()

const hours = computed(() => summarizeByHour(props.rows))

const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
</script>

<template>
	<section class="flex flex-col" aria-labelledby="hourly-title">
		<div class="mb-3">
			<h3 id="hourly-title" class="text-sm font-semibold text-highlighted">Resumen por hora</h3>
			<p class="text-xs text-muted">Pasajeros: total de la hora. Casetas: máximo de la hora.</p>
		</div>

		<!--
			Wide screens: scrolls inside the height it gets from the parent (thin scrollbar, with
			space reserved so it never covers the numbers). Phones: the page scrolls, and the
			sticky header stays at the top of the screen.
		-->
		<!-- tabindex: keyboard users can focus it to scroll it -->
		<div
			tabindex="0"
			role="group"
			aria-labelledby="hourly-title"
			class="min-h-0 flex-1 rounded-xs focus-visible:outline-2 focus-visible:outline-primary lg:overflow-y-auto lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin]"
		>
			<!-- Following USWDS tables: caption, scoped headers, right-aligned tabular numbers, sticky header -->
			<table class="w-full text-sm tabular-nums">
				<caption class="sr-only">Resumen por hora: pasajeros totales y máximo de casetas de cada hora</caption>
				<thead class="sticky top-0 z-10 bg-default">
					<tr class="border-b border-accented text-xs text-muted">
						<th scope="col" class="py-2 pr-2 text-left font-medium">Hora</th>
						<th scope="col" class="px-2 py-2 text-right font-medium">Pasajeros</th>
						<th scope="col" class="px-2 py-2 text-right font-medium">NPU/PDI</th>
						<th scope="col" class="py-2 pl-2 text-right font-medium">Aplanado</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in hours" :key="row.hour" class="border-b border-default last:border-0 even:bg-muted/60">
						<th scope="row" class="py-1.5 pr-2 text-left font-normal text-muted">{{ row.hour }}</th>
						<td class="px-2 py-1.5 text-right">{{ integer.format(row.pax) }}</td>
						<td class="px-2 py-1.5 text-right">{{ row.pdi_npu }}</td>
						<td class="py-1.5 pl-2 text-right font-semibold text-highlighted">{{ row.cap_aplanada }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>
