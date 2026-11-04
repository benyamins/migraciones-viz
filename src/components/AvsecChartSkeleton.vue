<script setup lang="ts">
import ChartSkeleton from './ChartSkeleton.vue'

// The async chart's props (rows, rules...) also reach this placeholder: only its class is used
defineOptions({ inheritAttrs: false })
</script>

<template>
	<!-- AvsecChart's legend: Pasajeros (eje derecho), Máquinas -->
	<ChartSkeleton :legend="['w-48', 'w-22']" :class="$attrs.class" />
</template>
