<script setup lang="ts">
import type { Page } from '../site'

defineProps<{
	page: Page
	/** True while the data loads: a skeleton holds the date's place. */
	loading: boolean
	/** When scripts/prepare.sql generated the data. */
	updatedAt?: Date
}>()

// Chile's time whatever the viewer's zone, 24-hour clock like the charts: '29 sept 2026, 13:34'
const updatedFormat = new Intl.DateTimeFormat('es-CL', {
	day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
	hourCycle: 'h23', timeZone: 'America/Santiago',
})
</script>

<template>
	<!--
		The page's title area: what the page shows, and when its data was prepared (next to the data
		it describes). Side padding on phones only, where main has none.
	-->
	<div class="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 px-4 sm:px-0">
		<div class="max-w-3xl min-w-0">
			<!-- the only h1 on the page: cards use h2, and tables h3 -->
			<h1 class="text-2xl/8 font-bold text-balance text-highlighted sm:text-3xl/9">{{ page.title }}</h1>
			<p class="mt-1 text-muted">{{ page.description }}</p>
		</div>
		<USkeleton v-if="loading" class="h-9 w-32" />
		<p v-else-if="updatedAt" class="sm:text-right">
			<!-- the hidden ": " separates the two lines for screen readers and copy-paste -->
			<span class="block text-xs text-muted">Datos actualizados<span class="sr-only">: </span></span>
			<time :datetime="updatedAt.toISOString()" class="block text-sm font-medium text-highlighted">
				{{ updatedFormat.format(updatedAt) }}
			</time>
		</p>
	</div>
</template>
