# Capacidad Nuevo Pudahuel

Projected passengers, booths, Aduanas y SAG channels and pórticos, and AVSEC machines at Nuevo
Pudahuel.
Published on GitHub Pages at https://jac-mtt.github.io/dashboard-capacidad-amb/ (repo
`jac-mtt/dashboard-capacidad-amb`). The test site, https://migraciones.rosebush.garden/ (repo
`benyamins/migraciones-viz`), runs the same code: push there first.

## Pages

| Page | URL | Shows |
|---|---|---|
| Pasajeros | `/` | Passengers per hour for one month: cards with the three busiest days and the three busiest 60 minutes, and a day × hour heatmap with each day's total and hora punta (its busiest 60 minutes). On the current month the cards count from today, without today's 60 minutes that have begun; on other months, the whole month |
| PDI | `/pdi` | Projected booths (NPU/PDI) and proposed capacity every 10 minutes, with the passengers |
| Aduanas y SAG | `/aduanas-sag` | Open SC and K9 channels and pórticos every 10 minutes, with the arriving passengers |
| AVSEC | `/avsec` | AVSEC machines every 10 minutes, with the departing passengers |

The filters stay in the URL, so links can open a given view: `/?mes=2026-10&proceso=salida`,
`/pdi?fecha=2026-10-17&proceso=llegada`, `/aduanas-sag?fecha=2026-10-17`, `/avsec?fecha=2026-10-17`.

The links between pages (the header's, and the cards at the bottom of Pasajeros) carry the day on
screen (`?fecha=`): PDI, Aduanas y SAG and AVSEC open on that day, and Pasajeros on its month
(`/?fecha=2026-10-17`). Changing the month on Pasajeros moves the day to that month's first day,
or to today in the current month. On today the links carry no date, so each page opens on its own
default, as on a first visit. The "Hoy" button, after the date's or month's arrows, goes back to today.
The filters aren't stored in the browser: each page's URL holds its state (`src/composables/selectedDay.ts`).

Each page is its own HTML file (`index.html`, `pdi.html`, `aduanas-sag.html`, `avsec.html`).
Names, links and descriptions live in `src/site.ts`.

## Requirements

Use `mise` for deps.

## Installation & Publishing

To publish follow the next steps.

```
mise use -g duckdb node pnpm
```
1. install dependencies
```bash
pnpm install
```

2. update the data.
```bash
duckdb -c ".read ./scripts/prepare.sql"
```

3. test the project
```bash
pnpm dev
```

4. build the project
```bash
pnpm build
```

5. push `main` to the test repo, and check the test site, https://migraciones.rosebush.garden/
```bash
git push origin main
```

6. publish it: push `main` to the official repo
```bash
git push jac main
```

Each push starts that repo's GitHub workflow, which builds and publishes its site in about a
minute. `origin` is the test repo, so a plain `git push` never publishes. Add the `jac` remote
once per clone:
```bash
git remote add jac https://github.com/jac-mtt/dashboard-capacidad-amb.git
```

## Analytics

The official site sends its visits to Google Analytics (GA4): property "Capacidad Nuevo Pudahuel"
in the "JAC-Data Analytics" account, web stream `capacity-amb-site`, measurement ID
`G-VDFNKX9E0S`. `src/analytics.ts` loads Google's tag (gtag.js, from Google's servers; no npm
package) only on `jac-mtt.github.io`, so the test site and `pnpm dev` send nothing.

What GA counts is set in the stream, not in the code: Admin → Data streams → `capacity-amb-site`
→ Enhanced measurement. Keep "Page changes based on browser history events" unticked in its page
views: the pages write their filters into the URL, and each change could count as one more view.
So a view is a page opened, and its URL has the filters it opened with.

GA sets its cookies (`_ga`, `_ga_VDFNKX9E0S`); GA4 doesn't keep IP addresses. Visits show in
Reports → Realtime within seconds, and in the other reports after a day or two. Ad blockers hide
some visits.

## Data

`scripts/prepare.sql` reads `data/source.xlsx` (kept out of git) and writes
`public/data/pax.parquet` (in git: the GitHub workflow only builds). It uses four sheets:

- `Capacidad aplanada`: passengers and booths per 10-minute segment and process.
- `capacidad_aduanas_sag`: the channel rules, one row per range of passengers per hour, with the
  columns `pax_min`, `pax_max`, `channels_open`, `sc_channels` and `k9_channels`.
- `porticos`: the pórticos rules, the same way, with the columns `pax_min`, `pax_max` and
  `porticos`.
- `avsec`: the AVSEC machine rules, one row per range of passengers who leave in 10 minutes,
  with the columns `pax_min`, `pax_max` and `maquinas`.

In all three rule sheets the last range leaves `pax_max` empty.

For each clock hour, the script takes the busiest 60 minutes of arrivals that spend at least 30
minutes inside that hour, and gives the hour the channels and the pórticos of that number's
ranges. It stores `sc_channels`, `k9_channels`, `porticos` and `sag_desde_min` (where those 60
minutes start, in minutes from the start of the hour) on each arrival row, and both sets of rules
in the file's metadata.

The AVSEC page gives each 10-minute segment of departures the machines of the range its
passengers fall in (rounded to a whole number), and its table shows each hour's maximum. The
script checks the `avsec` sheet and stores its rules in the file's metadata, but no column: each
segment's machines follow from its own passengers, so the page works them out
(`src/data/avsec.ts`) and the file stays 2.5 KB smaller.

If a rule sheet breaks a rule (a gap or overlap between ranges, SC + K9 different from
`channels_open`, an empty cell), the script stops with a message that names the sheet and the
Excel row, and the data file stays as it was.

To change the data or the rules: edit the Excel, run step 2, check with step 3, and push. No code
changes are needed.
