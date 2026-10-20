<script setup lang="ts">
import ChartSkeleton from './ChartSkeleton.vue'

// The async chart's props (rows, hours...) also reach this placeholder: only its class is used
defineOptions({ inheritAttrs: false })
</script>

<template>
	<!-- SagChart's legend: Pasajeros (eje derecho), SC, K9 -->
	<ChartSkeleton :legend="['w-48', 'w-12', 'w-12']" :class="$attrs.class" />
</template>
