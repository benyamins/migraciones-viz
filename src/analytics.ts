/*
  Google Analytics (GA4), on the official site only. The test site and local development run the
  same code but send nothing, so testing never counts as visits.
  It's the Google tag (gtag.js) from GA's installation instructions, loaded from Google's servers:
  no npm package. Property "Capacidad Nuevo Pudahuel" (account JAC-Data Analytics), web stream
  "capacity-amb-site". What it measures is set in GA, in the stream's Enhanced measurement (see
  the README).
*/

const MEASUREMENT_ID = 'G-VDFNKX9E0S'
const OFFICIAL_HOST = 'jac-mtt.github.io'

declare global {
	interface Window {
		dataLayer?: unknown[]
	}
}

/** Loads Google Analytics on the official site; anywhere else, does nothing. */
export function startAnalytics() {
	if (location.hostname !== OFFICIAL_HOST) return

	// GA's snippet: the commands wait in dataLayer until gtag.js loads. gtag.js reads only an
	// `arguments` object as a command: pushing an array instead would do nothing.
	const dataLayer = (window.dataLayer ??= [])
	function gtag(..._args: unknown[]) {
		dataLayer.push(arguments)
	}
	gtag('js', new Date())
	gtag('config', MEASUREMENT_ID)

	const script = document.createElement('script')
	script.async = true
	script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
	document.head.append(script)
}
