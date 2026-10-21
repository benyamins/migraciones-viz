<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import LoadError from '../components/LoadError.vue'
import SagDailyView from '../components/SagDailyView.vue'
import SagDailyViewSkeleton from '../components/SagDailyViewSkeleton.vue'
import { usePaxData } from '../composables/usePaxData'

const { rows, updatedAt, sagRules, porticoRules, loading, error } = usePaxData()
</script>

<template>
	<AppLayout page="aduanasSag" :loading="loading" :updated-at="updatedAt">
		<SagDailyViewSkeleton v-if="loading" />
		<LoadError v-else-if="error" :error="error" />
		<SagDailyView v-else :rows="rows" :sag-rules="sagRules" :portico-rules="porticoRules" />
	</AppLayout>
</template>
