<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import DailyView from '../components/DailyView.vue'
import DailyViewSkeleton from '../components/DailyViewSkeleton.vue'
import LoadError from '../components/LoadError.vue'
import { usePaxData } from '../composables/usePaxData'

const { rows, updatedAt, loading, error } = usePaxData()
</script>

<template>
	<AppLayout page="casetas" :loading="loading" :updated-at="updatedAt">
		<DailyViewSkeleton v-if="loading" />
		<LoadError v-else-if="error" :error="error" />
		<DailyView v-else :rows="rows" />
	</AppLayout>
</template>
