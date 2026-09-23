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
	<!-- Following USWDS tables: caption, scoped headers, right-aligned tabular numbers, sticky header -->
	<table class="w-full text-sm tabular-nums">
		<caption class="caption-top pb-2 text-left text-xs text-muted">
			Por hora. Pasajeros: total de la hora. Casetas: máximo de la hora.
		</caption>
		<thead class="sticky top-0 z-10 bg-default">
			<tr class="border-b border-accented text-xs text-muted">
				<th scope="col" class="py-2 pr-2 text-left font-medium">Hora</th>
				<th scope="col" class="px-2 py-2 text-right font-medium">Pasajeros</th>
				<th scope="col" class="px-2 py-2 text-right font-medium">NPU/PDI</th>
				<th scope="col" class="px-2 py-2 text-right font-medium">P75</th>
				<th scope="col" class="py-2 pl-2 text-right font-medium">Aplanado</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="row in hours" :key="row.hour" class="border-b border-default last:border-0 even:bg-muted/60">
				<th scope="row" class="py-1.5 pr-2 text-left font-normal text-muted">{{ row.hour }}</th>
				<td class="px-2 py-1.5 text-right">{{ integer.format(row.pax) }}</td>
				<td class="px-2 py-1.5 text-right">{{ row.pdi_npu }}</td>
				<td class="px-2 py-1.5 text-right">{{ row.cap_percentil_75 }}</td>
				<td class="py-1.5 pl-2 text-right font-semibold text-highlighted">{{ row.cap_aplanada }}</td>
			</tr>
		</tbody>
	</table>
</template>
