<template>
	<!--
		Placeholder with the same size as CapacityChart (legend row + chart), shown while the
		ECharts chunk downloads. USkeleton marks each block as an English "loading" alert, so
		the blocks are hidden from screen readers and one Spanish status message is announced.
	-->
	<div role="status">
		<span class="sr-only">Cargando gráfico…</span>
		<div aria-hidden="true">
			<!-- same flex/wrap rules as the real legend row: one line on desktop, three on phones -->
			<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
				<div class="flex flex-wrap gap-x-5 gap-y-1.5">
					<USkeleton class="h-5 w-52" />
					<USkeleton class="h-5 w-36" />
				</div>
				<USkeleton class="h-5 w-40" />
			</div>
			<USkeleton class="mt-3 h-80 sm:h-96" />
		</div>
	</div>
</template>
