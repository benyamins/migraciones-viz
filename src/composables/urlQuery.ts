/*
  Filters kept in the page's URL (?fecha=2026-10-17&proceso=llegada), so a reload or a shared
  link shows the same view, and the index can link to a given day.
*/

/** A parameter from the URL the page was opened with, or null. */
export function readQuery(name: string): string | null {
	return new URLSearchParams(location.search).get(name)
}

/** Puts the filters in the URL. replaceState: changing a filter doesn't add a step to Back. */
export function writeQuery(values: Record<string, string>) {
	const url = new URL(location.href)
	for (const [name, value] of Object.entries(values)) url.searchParams.set(name, value)
	history.replaceState(history.state, '', url)
}
