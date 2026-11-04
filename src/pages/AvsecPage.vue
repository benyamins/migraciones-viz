<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import AvsecDailyView from '../components/AvsecDailyView.vue'
import AvsecDailyViewSkeleton from '../components/AvsecDailyViewSkeleton.vue'
import LoadError from '../components/LoadError.vue'
import { usePaxData } from '../composables/usePaxData'

const { rows, updatedAt, avsecRules, loading, error } = usePaxData()
</script>

<template>
	<AppLayout page="avsec" :loading="loading" :updated-at="updatedAt">
		<AvsecDailyViewSkeleton v-if="loading" />
		<LoadError v-else-if="error" :error="error" />
		<AvsecDailyView v-else :rows="rows" :rules="avsecRules" />
	</AppLayout>
</template>
