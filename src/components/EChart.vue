<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { echarts, type EChartsOption } from '../lib/echarts'

const props = defineProps<{ option: EChartsOption }>()

const container = useTemplateRef<HTMLDivElement>('container')

// Plain variables, not refs: ECharts owns this object. Making it reactive would
// wrap it in a Vue proxy, which slows ECharts down and can break it.
let chart: echarts.EChartsType | undefined
let observer: ResizeObserver | undefined

onMounted(() => {
	const el = container.value!
	// Also fires once right away. The chart is created on the first call where the container
	// has a size: while hidden (the table view on phones) there is nothing to draw into.
	observer = new ResizeObserver(() => {
		if (!el.clientWidth || !el.clientHeight) return
		if (chart) {
			chart.resize()
		} else {
			chart = echarts.init(el, null, { renderer: 'svg' })
			chart.setOption(props.option)
		}
	})
	observer.observe(el)
})

// A new option object arrives whenever the parent's computed re-runs. `notMerge` replaces the
// whole chart with it, so the option is the single source of truth: parts that disappear
// (e.g. the passengers axis) are removed. (ECharts' partial `replaceMerge` of y axes crashes.)
watch(() => props.option, option => chart?.setOption(option, { notMerge: true }))

onBeforeUnmount(() => {
	observer?.disconnect()
	chart?.dispose()
})
</script>

<template>
	<div ref="container" />
</template>
