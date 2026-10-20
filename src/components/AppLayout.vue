<script setup lang="ts">
import { es } from '@nuxt/ui/locale'
import logoJac from '../assets/logo-jac.svg'
import { APP_NAME, PAGES, type PageId } from '../site'
import PageHeader from './PageHeader.vue'

defineProps<{
	/** The page on screen: its link is marked as the current one, and its title goes on top. */
	page: PageId
	/** True while the data loads. */
	loading: boolean
	/** When scripts/prepare.sql generated the data. */
	updatedAt?: Date
}>()

const links = Object.entries(PAGES) as [PageId, (typeof PAGES)[PageId]][]
</script>

<template>
	<!-- UApp provides what Nuxt UI components need (tooltips, toasts, locale for the calendar) -->
	<UApp :locale="es">
		<!--
			USWDS: a skip link before the header, so keyboard users can jump past the links.
			It sits above the screen until it gets the focus.
		-->
		<a
			href="#main-content"
			class="fixed top-2 left-2 z-50 -translate-y-[200%] rounded-md bg-default px-4 py-3 text-sm font-semibold text-primary underline shadow-lg ring ring-default focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform"
		>
			Saltar al contenido principal
		</a>

		<!-- In dark mode the page is darker than the cards, so cards still read as raised -->
		<div class="min-h-dvh bg-muted dark:bg-(--ui-color-neutral-950)">
			<header class="border-b border-default bg-default">
				<!--
					87.5rem = USWDS "widescreen" container: dashboards benefit from the extra width.
					Two rows, like the USWDS extended header: the app's name, then the page links.
					From sm up the links sit right of the logo; on phones they don't fit there, so
					they get their own row under it.
				-->
				<div class="mx-auto grid max-w-[87.5rem] grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 px-4 sm:gap-x-6 sm:px-6">
					<!--
						Chilean government convention (as on hacienda.cl): the logo hangs from the top
						edge. From sm up it also hangs past the bottom of the header: it spans both rows,
						and -mb-6 takes 24px off the 120px it claims, so it never makes the header taller.
						On phones it stays inside the header, above the links.
						3.5cm is the minimum width for sub-unit logos in the Manual de Normas Gráficas del
						Gobierno de Chile v3.0. width/height give the aspect ratio before the file loads.
						The SVG carries its own colors, so it looks the same in dark mode.
					-->
					<img
						:src="logoJac"
						width="200"
						height="181"
						alt="Junta de Aeronáutica Civil, Ministerio de Transportes y Telecomunicaciones, Gobierno de Chile"
						class="w-[3.5cm] sm:row-span-2 sm:-mb-6"
					>
					<div class="flex min-w-0 flex-col gap-0.5 pt-3 sm:pb-1">
						<!-- every number on the site is a projection, so this comes first and always shows -->
						<p class="text-xs font-bold tracking-widest text-primary uppercase max-sm:tracking-wide">Proyección</p>
						<!-- USWDS: the site name links to the index, and isn't the page's h1 -->
						<a
							:href="PAGES.pasajeros.href"
							class="self-start rounded-xs text-lg/6 font-bold text-highlighted hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-xl/7"
						>
							{{ APP_NAME }}
						</a>
					</div>
					<UColorModeButton class="mt-2 shrink-0 justify-center max-sm:size-11 sm:mt-3" />

					<!--
						USWDS: the current page is marked with aria-current and a 4px underline in the
						primary color. Every link is semibold, so none moves when the current one changes.
						-mb-px: the underline covers the header's bottom border. 44px tall for thumbs.
					-->
					<nav aria-label="Principal" class="col-span-3 sm:col-span-2 sm:col-start-2">
						<ul class="-mb-px flex flex-wrap gap-x-6 sm:gap-x-8">
							<li v-for="[id, link] in links" :key="id">
								<a
									:href="link.href"
									:aria-current="id === page ? 'page' : undefined"
									:class="[
										'flex h-11 items-center border-y-4 border-transparent text-sm font-semibold focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-base',
										id === page ? 'border-b-primary text-highlighted' : 'text-toned hover:border-b-accented hover:text-highlighted',
									]"
								>
									{{ link.label }}
								</a>
							</li>
						</ul>
					</nav>
				</div>
			</header>

			<!--
				The skip link's target. Top padding from sm up: the 24px the logo can hang below the
				header, and some air. No side padding on phones: the cards go edge to edge.
			-->
			<main id="main-content" tabindex="-1" class="mx-auto max-w-[87.5rem] pt-6 pb-4 outline-none sm:px-6 sm:pt-10 sm:pb-6">
				<PageHeader :page="PAGES[page]" :loading="loading" :updated-at="updatedAt" />
				<slot />
			</main>
		</div>
	</UApp>
</template>
