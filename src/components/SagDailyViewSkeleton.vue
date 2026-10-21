<script setup lang="ts">
import ChartSkeleton from './ChartSkeleton.vue'
</script>

<template>
	<!--
		Shown while the Parquet file loads: SagDailyView's layout block by block (same classes,
		same heights). Like DailyViewSkeleton on PDI.
	-->
	<div role="status">
		<span class="sr-only">Cargando datos…</span>
		<section aria-hidden="true" class="border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x">
			<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
				<div class="flex w-full flex-wrap items-start justify-between gap-4 lg:w-auto">
					<div>
						<USkeleton class="h-4 w-24" />
						<USkeleton class="mt-1 h-7 w-24" />
						<USkeleton class="mt-0.5 h-5 w-60 max-sm:hidden" />
					</div>
					<USkeleton class="h-11 w-48 sm:h-10 lg:hidden" />
				</div>
				<div class="w-full sm:w-auto">
					<USkeleton class="mb-1.5 h-5 w-11" />
					<USkeleton class="h-11 w-full sm:h-10 sm:w-67" />
				</div>
			</div>

			<div class="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-0">
				<ChartSkeleton :legend="['w-48', 'w-12', 'w-12', 'w-22']" class="lg:pr-6" />
				<div class="hidden overflow-hidden lg:block lg:border-l lg:border-default lg:pl-6 lg:contain-size">
					<USkeleton class="h-5 w-36" />
					<!-- the note under the title takes two lines -->
					<USkeleton class="mt-0.5 h-3 w-80" />
					<USkeleton class="mt-1 h-3 w-56" />
					<div class="mt-4 space-y-3.5">
						<USkeleton v-for="row in 11" :key="row" class="h-5" />
					</div>
				</div>
			</div>
		</section>
	</div>
</template>
