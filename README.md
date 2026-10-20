# Capacidad Nuevo Pudahuel

Projected passengers, booths and SAG channels for the migration control at Nuevo Pudahuel.
Published on GitHub Pages at https://migraciones.rosebush.garden/.

## Pages

| Page | URL | Shows |
|---|---|---|
| Pasajeros | `/` | Passengers per hour for one month: a day × hour heatmap, with each day's total and hora punta (its busiest 60 minutes) |
| Casetas | `/casetas` | Projected booths (NPU/PDI) and proposed capacity every 10 minutes, with the passengers |
| Aduanas y SAG | `/aduanas-sag` | Open SC and K9 channels every 10 minutes, with the arriving passengers |

The filters stay in the URL, so links can open a given view: `/?mes=2026-10&proceso=salida`,
`/casetas?fecha=2026-10-17&proceso=llegada`, `/aduanas-sag?fecha=2026-10-17`.

Each page is its own HTML file (`index.html`, `casetas.html`, `aduanas-sag.html`). Names,
links and descriptions live in `src/site.ts`.

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

5. push to `main` to let the github workflow start.

## Data

`scripts/prepare.sql` reads `data/source.xlsx` (kept out of git) and writes
`public/data/pax.parquet` (in git: the GitHub workflow only builds). It uses two sheets:

- `Capacidad aplanada`: passengers and booths per 10-minute segment and process.
- `capacidad_aduanas_sag`: the SAG rules, one row per range of passengers per hour, with the
  columns `pax_min`, `pax_max`, `channels_open`, `sc_channels` and `k9_channels`. The last range
  leaves `pax_max` empty.

For each clock hour, the script takes the busiest 60 minutes of arrivals that spend at least 30
minutes inside that hour, and gives the hour the channels of that number's range. It stores
`sc_channels`, `k9_channels` and `sag_desde_min` (where those 60 minutes start, in minutes from
the start of the hour) on each arrival row, and the rules in the file's metadata. If the sheet
breaks a rule (a gap or overlap between ranges, SC + K9 different from `channels_open`, an empty
cell), the script stops with a message that names the Excel row, and the data file stays as it was.

To change the data or the rules: edit the Excel, run step 2, check with step 3, and push. No code
changes are needed.
