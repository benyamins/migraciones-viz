<script setup lang="ts">
// The async chart's props (rows, day...) also reach this placeholder: only its class is used
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
	/** Width of each legend item, in the chart's legend order. Default: CapacityChart's four. */
	legend?: string[]
}>(), {
	legend: () => ['w-48', 'w-22', 'w-28', 'w-36'],
})
</script>

<template>
	<!--
		Placeholder with the same size as a chart (legend row + chart), shown while the ECharts
		chunk downloads. USkeleton marks each block as an English "loading" alert, so the blocks
		are hidden from screen readers and one Spanish status message is announced.
	-->
	<div role="status" :class="$attrs.class">
		<span class="sr-only">Cargando gráfico…</span>
		<div aria-hidden="true">
			<!-- same flex/wrap rules as the real legend row, so it wraps the same way on phones -->
			<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
				<div class="flex flex-wrap gap-x-5 gap-y-1.5">
					<USkeleton v-for="(width, i) in legend" :key="i" :class="['h-5', width]" />
				</div>
				<USkeleton class="h-5 w-40" />
			</div>
			<USkeleton class="mt-3 h-80 sm:h-96" />
		</div>
	</div>
</template>
