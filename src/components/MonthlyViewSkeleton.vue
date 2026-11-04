<template>
	<!--
		Shown while the Parquet file loads. It repeats MonthlyView's layout block by block (same
		classes, about the same heights), so little jumps when the real content replaces it.
		Screen readers get one Spanish status message instead of every block.
	-->
	<div role="status">
		<span class="sr-only">Cargando datos…</span>
		<section aria-hidden="true" class="border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x">
			<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
				<div>
					<USkeleton class="h-4 w-28" />
					<USkeleton class="mt-1 h-7 w-28" />
					<USkeleton class="mt-0.5 h-5 w-32 max-sm:hidden" />
				</div>
				<div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-6">
					<div>
						<USkeleton class="mb-1.5 h-5 w-14" />
						<USkeleton class="h-11 w-full sm:h-10 sm:w-53" />
					</div>
					<div>
						<USkeleton class="mb-1.5 h-5 w-10" />
						<USkeleton class="h-11 w-full sm:h-10 sm:w-80" />
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<!-- the two cards: label (20px line), value (32px) and passengers (24px), each bar centered on its line -->
				<div class="grid max-w-3xl gap-3 md:grid-cols-2 md:gap-4">
					<div v-for="card in 2" :key="card" class="rounded-lg border border-default p-4">
						<USkeleton class="h-5 w-44" />
						<USkeleton class="mt-1.5 h-7 w-40" />
						<USkeleton class="mt-1 mb-0.5 h-5 w-32" />
					</div>
				</div>
				<!-- the color legend: its label and items wrap to 3 lines on phones, 2 on md, 1 from lg up -->
				<div class="mt-6 space-y-2">
					<USkeleton class="h-5 w-36 lg:w-full lg:max-w-2xl" />
					<USkeleton class="h-5 w-full max-w-md lg:hidden" />
					<USkeleton class="h-5 w-2/3 max-w-xs md:hidden" />
				</div>
				<!-- a month of rows -->
				<USkeleton class="mt-5 h-[52rem]" />
				<!-- the three notes under it -->
				<USkeleton class="mt-4 h-5 w-[36rem] max-w-full" />
				<USkeleton class="mt-1 h-5 w-96 max-w-full" />
				<USkeleton class="mt-1 h-5 w-64" />
			</div>
		</section>
	</div>
</template>
