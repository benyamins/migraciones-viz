<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import LoadError from '../components/LoadError.vue'
import SagDailyView from '../components/SagDailyView.vue'
import SagDailyViewSkeleton from '../components/SagDailyViewSkeleton.vue'
import SagRules from '../components/SagRules.vue'
import { usePaxData } from '../composables/usePaxData'

const { rows, updatedAt, sagRules, loading, error } = usePaxData()
</script>

<template>
	<AppLayout page="aduanasSag" :loading="loading" :updated-at="updatedAt">
		<SagDailyViewSkeleton v-if="loading" />
		<LoadError v-else-if="error" :error="error" />
		<template v-else>
			<SagDailyView :rows="rows" :rules="sagRules" />
			<SagRules v-if="sagRules.length" :rules="sagRules" class="mt-4 sm:mt-6" />
		</template>
	</AppLayout>
</template>
