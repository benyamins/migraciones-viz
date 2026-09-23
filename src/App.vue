<script setup lang="ts">
import { es } from '@nuxt/ui/locale'
import logoJac from './assets/logo-jac.webp'
import DailyView from './components/DailyView.vue'
import DailyViewSkeleton from './components/DailyViewSkeleton.vue'
import { usePaxData } from './composables/usePaxData'

const { rows, loading, error } = usePaxData()
</script>

<template>
	<!-- UApp provides what Nuxt UI components need (tooltips, toasts, locale for the calendar) -->
	<UApp :locale="es">
		<!-- In dark mode the page is darker than the cards, so cards still read as raised -->
		<div class="min-h-dvh bg-muted dark:bg-(--ui-color-neutral-950)">
			<header class="border-b border-default bg-default">
				<!-- 87.5rem = USWDS "widescreen" container: dashboards benefit from the extra width -->
				<div class="mx-auto flex max-w-[87.5rem] items-start gap-4 px-4 sm:gap-6 sm:px-6">
					<!--
						Chilean government convention (as on jac.gob.cl): the logo block sits top left,
						against the top edge. 3.5cm is the minimum width for sub-unit logos in the
						Manual de Normas Gráficas del Gobierno de Chile v3.0. width/height give the
						aspect ratio, so the header doesn't jump while the image loads.
					-->
					<img
						:src="logoJac"
						width="397"
						height="359"
						alt="Junta de Aeronáutica Civil, Ministerio de Transportes y Telecomunicaciones, Gobierno de Chile"
						class="w-[3.5cm] shrink-0"
					>
					<div class="min-w-0 flex-1 py-3 sm:py-5">
						<!-- narrower tracking on phones keeps it on one line next to the logo -->
						<p class="text-xs font-bold tracking-widest text-primary uppercase max-sm:tracking-wide">Control migratorio</p>
						<h1 class="mt-1 text-lg/6 font-bold text-highlighted sm:text-2xl">Capacidad de casetas</h1>
						<p class="mt-1 max-w-2xl text-sm text-muted max-sm:hidden">
							Casetas usadas (NPU/PDI) y capacidad propuesta, en intervalos de 10 minutos.
						</p>
					</div>
					<UColorModeButton class="mt-3 shrink-0 justify-center max-sm:size-11 sm:mt-5" />
				</div>
			</header>

			<!-- no side padding on phones: the card goes edge to edge -->
			<main class="mx-auto max-w-[87.5rem] py-4 sm:px-6 sm:py-6">
				<DailyViewSkeleton v-if="loading" />
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
