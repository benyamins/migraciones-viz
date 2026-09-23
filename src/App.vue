<script setup lang="ts">
import { es } from '@nuxt/ui/locale'
import DailyView from './components/DailyView.vue'
import { usePaxData } from './composables/usePaxData'

const { rows, loading, error } = usePaxData()
</script>

<template>
	<!-- UApp provides what Nuxt UI components need (tooltips, toasts, locale for the calendar) -->
	<UApp :locale="es">
		<!-- In dark mode the page is darker than the cards, so cards still read as raised -->
		<div class="min-h-dvh bg-muted dark:bg-(--ui-color-neutral-950)">
			<header class="border-b border-default bg-default">
				<!-- blue/red band from the gob.cl identity -->
				<div class="flex h-1" aria-hidden="true">
					<div class="w-1/3 bg-gob-500" />
					<div class="flex-1 bg-gob-red" />
				</div>
				<!-- 87.5rem = USWDS "widescreen" container: dashboards benefit from the extra width -->
				<div class="mx-auto flex max-w-[87.5rem] items-start justify-between gap-4 px-4 py-3 sm:px-6 sm:py-5">
					<div>
						<p class="text-xs font-bold tracking-widest text-primary uppercase">Control migratorio</p>
						<h1 class="mt-1 text-xl font-bold text-highlighted sm:text-2xl">Capacidad de casetas</h1>
						<p class="mt-1 max-w-2xl text-sm text-muted">
							Casetas usadas (NPU/PDI) y capacidad propuesta, en intervalos de 10 minutos.
						</p>
					</div>
					<UColorModeButton class="shrink-0 justify-center max-sm:size-11" />
				</div>
			</header>

			<!-- no side padding on phones: the card goes edge to edge -->
			<main class="mx-auto max-w-[87.5rem] py-4 sm:px-6 sm:py-6">
				<USkeleton v-if="loading" class="h-[34rem] w-full" />
				<UAlert
					v-else-if="error"
					color="error"
					variant="subtle"
					icon="i-lucide-circle-alert"
					title="No se pudieron cargar los datos"
					:description="error.message"
				/>
				<DailyView v-else :rows="rows" />
			</main>
		</div>
	</UApp>
</template>
