/*
  Passenger sums. Each 10-minute value has one decimal, and adding them as floats piles up
  rounding errors: 400.5 could come out as 400.49999 and round down. So sums add whole tenths
  and round once at the end, half up, like DuckDB's ROUND in scripts/prepare.sql. The pages
  then show the same numbers the SAG channels were decided on.
*/

/** A 10-minute pax value (one decimal) as whole tenths: 52.4 → 524. */
export function tenths(pax: number): number {
	return Math.round(pax * 10)
}

/** A sum of tenths as whole passengers, rounded half up: 4005 → 401. */
export function wholePax(sumOfTenths: number): number {
	return Math.round(sumOfTenths / 10)
}
