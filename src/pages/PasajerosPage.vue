<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import LoadError from '../components/LoadError.vue'
import MonthlyView from '../components/MonthlyView.vue'
import MonthlyViewSkeleton from '../components/MonthlyViewSkeleton.vue'
import { usePaxData } from '../composables/usePaxData'
import { PAGES } from '../site'

const { rows, updatedAt, loading, error } = usePaxData()

// The other pages, explained for first-time visitors
const others = [
	{ page: PAGES.pdi, cta: 'Ver PDI' },
	{ page: PAGES.aduanasSag, cta: 'Ver Aduanas y SAG' },
]
</script>

<template>
	<AppLayout page="pasajeros" :loading="loading" :updated-at="updatedAt">
		<MonthlyViewSkeleton v-if="loading" />
		<LoadError v-else-if="error" :error="error" />
		<MonthlyView v-else :rows="rows" />

		<ul class="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2">
			<li
				v-for="{ page, cta } in others"
				:key="page.file"
				class="flex flex-col items-start border-y border-default bg-default p-4 shadow-xs sm:rounded-lg sm:border-x sm:p-6"
			>
				<h2 class="text-lg font-bold text-highlighted">{{ page.title }}</h2>
				<p class="mt-1 text-sm text-muted">{{ page.description }}</p>
				<a
					:href="page.href"
					class="mt-3 inline-flex items-center gap-1.5 rounded-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
				>
					{{ cta }}
					<UIcon name="i-lucide-arrow-right" class="size-4" />
				</a>
			</li>
		</ul>
	</AppLayout>
</template>
