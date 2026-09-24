<script setup lang="ts">
import { es } from '@nuxt/ui/locale'
import logoJac from './assets/logo-jac.svg'
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
				<div class="mx-auto flex max-w-[87.5rem] items-center gap-4 px-4 sm:gap-6 sm:px-6">
					<!--
						Chilean government convention (as on hacienda.cl): the logo hangs from the top
						edge and past the bottom of the header bar. -mb-6 takes 24px off the space the
						logo claims, so the bar is 120 - 24 = 96px tall and the logo hangs 24px below it.
						3.5cm is the minimum width for sub-unit logos in the Manual de Normas Gráficas del
						Gobierno de Chile v3.0. width/height give the aspect ratio before the file loads.
						The SVG carries its own colors, so it looks the same in dark mode.
					-->
					<img
						:src="logoJac"
						width="200"
						height="181"
						alt="Junta de Aeronáutica Civil, Ministerio de Transportes y Telecomunicaciones, Gobierno de Chile"
						class="-mb-6 w-[3.5cm] shrink-0 self-start"
					>
					<!--
						Fits the 96px bar: at most 72px of text + 12px above and below. A wrapped line
						would make the bar taller, so the eyebrow and the description hide where they
						wouldn't fit on one line.
						`gap-1` instead of margins: a hidden line leaves no gap behind.
						`@container` lets children react to this block's width (a container query)
						instead of the screen's width.
					-->
					<div class="@container flex min-w-0 flex-1 flex-col gap-1 py-3">
						<!-- 143px wide with the phone tracking: hidden below 9rem (144px), i.e. phones under ~385px -->
						<p class="text-xs font-bold tracking-widest text-primary uppercase max-sm:tracking-wide @max-[9rem]:hidden">
							Control migratorio
						</p>
						<h1 class="text-lg/6 font-bold text-highlighted sm:text-2xl/7">Capacidad de casetas</h1>
						<!-- one line only from lg up -->
						<p class="max-w-2xl text-sm text-muted max-lg:hidden">
							Casetas usadas (NPU/PDI) y capacidad propuesta, en intervalos de 10 minutos.
						</p>
					</div>
					<UColorModeButton class="shrink-0 justify-center max-sm:size-11" />
				</div>
			</header>

			<!--
				Top padding = the 24px the logo hangs below the header + the usual gap (16px on
				phones, 24px from sm up). No side padding on phones: the card goes edge to edge.
			-->
			<main class="mx-auto max-w-[87.5rem] pt-10 pb-4 sm:px-6 sm:pt-12 sm:pb-6">
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
