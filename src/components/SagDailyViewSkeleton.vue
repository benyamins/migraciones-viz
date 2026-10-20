<script setup lang="ts">
import ChartSkeleton from './ChartSkeleton.vue'
</script>

<template>
	<!--
		Shown while the Parquet file loads: SagDailyView's layout block by block (same classes,
		same heights), and the "Cómo se calcula" box. Like DailyViewSkeleton on Casetas.
	-->
	<div role="status">
		<span class="sr-only">Cargando datos…</span>
		<div aria-hidden="true">
			<section class="border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x">
				<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
					<div class="flex w-full flex-wrap items-start justify-between gap-4 xl:w-auto">
						<div>
							<USkeleton class="h-4 w-24" />
							<USkeleton class="mt-1 h-7 w-24" />
							<USkeleton class="mt-0.5 h-5 w-60 max-sm:hidden" />
						</div>
						<USkeleton class="h-11 w-48 sm:h-10 xl:hidden" />
					</div>
					<div class="w-full sm:w-auto">
						<USkeleton class="mb-1.5 h-5 w-11" />
						<USkeleton class="h-11 w-full sm:h-10 sm:w-67" />
					</div>
				</div>

				<div class="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_27rem] xl:gap-0">
					<ChartSkeleton :legend="['w-48', 'w-12', 'w-12']" class="xl:pr-6" />
					<div class="hidden overflow-hidden xl:block xl:border-l xl:border-default xl:pl-6 xl:contain-size">
						<USkeleton class="h-5 w-36" />
						<USkeleton class="h-4 w-80" />
						<div class="mt-4 space-y-3.5">
							<USkeleton v-for="row in 11" :key="row" class="h-5" />
						</div>
					</div>
				</div>
			</section>

			<section class="mt-4 grid gap-x-12 gap-y-4 border-y border-default bg-default p-4 shadow-xs sm:mt-6 sm:rounded-lg sm:border-x sm:p-6 lg:grid-cols-[minmax(0,36rem)_auto]">
				<div>
					<USkeleton class="h-7 w-40" />
					<USkeleton class="mt-1 h-15 w-full" />
				</div>
				<USkeleton class="h-40 w-80 max-w-full" />
			</section>
		</div>
	</div>
</template>
