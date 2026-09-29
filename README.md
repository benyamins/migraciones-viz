# Test Dashboard

To make it work:

## Requirements

Use `mise` for deps.

```
mise use -g duckdb pnpm
```
1. install dependencies
```bash
pnpm install
```

2. update the data.
```bash
duckdb -c ".read ./scripts/prepare.sql"
```

3. test the proyect
```bash
pnpm dev
```

4. build the proyect
```bash
pnpm build
```

5. push to main to let the github workflow start.
