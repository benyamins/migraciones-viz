<template>
	<!--
		Shown while the Parquet file loads. It repeats MonthlyView's layout block by block (same
		classes, about the same heights), so little jumps when the real content replaces it.
		Screen readers get one Spanish status message instead of every block.
	-->
	<div role="status">
		<span class="sr-only">Cargando datos…</span>
		<section aria-hidden="true" class="@container border-y border-default bg-default shadow-xs sm:rounded-lg sm:border-x">
			<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-default p-4 sm:p-6">
				<div class="flex w-full flex-wrap items-start justify-between gap-4 @min-[81rem]:w-auto">
					<div>
						<USkeleton class="h-4 w-28" />
						<USkeleton class="mt-1 h-7 w-28" />
						<USkeleton class="mt-0.5 h-5 w-32 max-sm:hidden" />
					</div>
					<USkeleton class="h-11 w-48 sm:h-10 @min-[81rem]:hidden" />
				</div>
				<div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-6">
					<div>
						<USkeleton class="mb-1.5 h-5 w-14" />
						<USkeleton class="h-11 w-full sm:h-10 sm:w-53" />
					</div>
					<div>
						<USkeleton class="mb-1.5 h-5 w-10" />
						<USkeleton class="h-11 w-full sm:h-10 sm:w-67" />
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<USkeleton class="h-6 w-full max-w-3xl" />
				<USkeleton class="mt-1 h-6 w-2/3 max-w-xl" />
				<USkeleton class="mt-4 h-5 w-full max-w-2xl" />
				<!-- a month of rows -->
				<USkeleton class="mt-5 h-[52rem]" />
				<USkeleton class="mt-4 h-5 w-96 max-w-full" />
				<USkeleton class="mt-1 h-5 w-64" />
			</div>
		</section>
	</div>
</template>
