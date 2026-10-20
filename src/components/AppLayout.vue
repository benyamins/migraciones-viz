<script setup lang="ts">
import { es } from '@nuxt/ui/locale'
import logoJac from './assets/logo-jac.svg'
import DailyView from './components/DailyView.vue'
import DailyViewSkeleton from './components/DailyViewSkeleton.vue'
import { usePaxData } from './composables/usePaxData'

const { rows, updatedAt, loading, error } = usePaxData()

// Chile's time whatever the viewer's zone, 24-hour clock like the chart: '29 sept 2026, 13:34'
const updatedFormat = new Intl.DateTimeFormat('es-CL', {
	day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
	hourCycle: 'h23', timeZone: 'America/Santiago',
})
</script>

<template>
	<!-- UApp provides what Nuxt UI components need (tooltips, toasts, locale for the calendar) -->
	<UApp :locale="es">
		<!-- In dark mode the page is darker than the cards, so cards still read as raised -->
		<div class="min-h-dvh bg-muted dark:bg-(--ui-color-neutral-950)">
			<header class="border-b border-default bg-default">
				<!--
					87.5rem = USWDS "widescreen" container: dashboards benefit from the extra width.
					relative: the data date below md is positioned against this box.
				-->
				<div class="relative mx-auto flex max-w-[87.5rem] items-center gap-4 px-4 sm:gap-6 sm:px-6">
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
						Fits the 96px bar: at most 72px of text + 12px above and below. The description
						would wrap below lg (a second line would make the bar taller), so it shows from
						lg up. `gap-1` instead of margins: a hidden line leaves no gap behind.
					-->
					<div class="flex min-w-0 flex-1 flex-col gap-1 py-3">
						<!-- every number on the page is a projection, so this comes first and always shows -->
						<p class="text-xs font-bold tracking-widest text-primary uppercase max-sm:tracking-wide">Proyección</p>
						<h1 class="text-lg/6 font-bold text-highlighted sm:text-2xl/7">Capacidad de casetas</h1>
						<p class="max-w-2xl text-sm text-muted max-lg:hidden">
							Casetas proyectadas (NPU/PDI) y capacidad propuesta, en intervalos de 10 minutos.
						</p>
					</div>
					<!--
						When the data was prepared (scripts/prepare.sql writes it into the Parquet file).
						From md up it sits in the bar, left of the theme toggle, and the skeleton holds its
						place while the file loads, so the title doesn't shift. Below md the bar has no room
						(the title would wrap), so it hangs below the bar on the right, next to the logo;
						main's top padding leaves room for it. top/right only apply while it's absolute.
					-->
					<USkeleton v-if="loading" class="h-9 w-32 shrink-0 max-md:hidden" />
					<p
						v-else-if="updatedAt"
						class="top-full right-4 shrink-0 text-right max-md:absolute max-md:mt-1 sm:right-6"
					>
						<!-- the hidden ": " separates the two lines for screen readers and copy-paste -->
						<span class="block text-xs text-muted">Datos actualizados<span class="sr-only">: </span></span>
						<time :datetime="updatedAt.toISOString()" class="block text-sm font-medium text-highlighted">
							{{ updatedFormat.format(updatedAt) }}
						</time>
					</p>
					<UColorModeButton class="shrink-0 justify-center max-sm:size-11" />
				</div>
			</header>

			<!--
				Top padding = the 24px the logo hangs below the header + 24px (below md, the data
				date sits in that space). No side padding on phones: the card goes edge to edge.
			-->
			<main class="mx-auto max-w-[87.5rem] pt-12 pb-4 sm:px-6 sm:pb-6">
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
