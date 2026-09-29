# Test Dashboard

To make it work:

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
