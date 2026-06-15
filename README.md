# nugget

A Discord bot for managing a football prediction pool ("polla"), backed by a PostgreSQL database and a Python image-generation service. Built as an Nx monorepo with two independently deployable apps.

## Apps

| App | Stack | Description |
|-----|-------|-------------|
| `apps/bot` | TypeScript · Node.js · Discord.js · PostgreSQL | Discord slash-command bot for the prediction game |
| `apps/utility` | Python · FastAPI · matplotlib/seaborn | REST service that generates prediction-distribution heatmap images |

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | `v24.13.1` (see `.nvmrc`) |
| pnpm | `10.30.1` (via Corepack) |
| Python | `≥ 3.13` |
| uv | latest |
| Docker + Docker Compose | any recent version |

> Docker must be available before running `pnpm install` — the `postinstall` hook pulls `sqlc/sqlc:latest`.

---

## Quickstart

### Bot

```bash
# 1. Enable the right pnpm via Corepack
corepack enable

# 2. Install JS dependencies (also pulls the sqlc Docker image)
pnpm install

# 3. Start the local Postgres container
docker compose up -d          # binds localhost:5433

# 4. Apply all pending migrations
pnpm nx run bot:migrate-up-dev

# 5. Start in dev mode (requires a valid Discord token in config.yaml or env)
pnpm nx run bot:dev
```

### Utility service

```bash
# Install Python dependencies
pnpm nx run utility:install   # runs: uv sync

# Start in dev mode
pnpm nx run utility:dev       # runs: uv run fastapi dev main.py
```

---

## Configuration

Config is loaded in this order: built-in defaults → `config.yaml` → environment variables. In non-production, `.env` is auto-loaded first.

Create `apps/bot/config.yaml` (or set the equivalent env vars):

```yaml
database:
  url: postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
discord:
  token: <your-discord-bot-token>
polla:
  costo_entrada: 100
  fraccion_comision_org: 0.1
  fraccion_extra_campeon: 0.25
  factor_bloque_maximo: 10
```

Equivalent environment variables (keys are split on `_`):

```bash
DATABASE_URL=postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
DISCORD_TOKEN=your-token-here
POLLA_COSTO_ENTRADA=100
POLLA_FRACCION_COMISION_ORG=0.1
POLLA_FRACCION_EXTRA_CAMPEON=0.25
POLLA_FACTOR_BLOQUE_MAXIMO=10
```

---

## Commands

All tasks run through Nx from the **workspace root**.

### Bot

```bash
pnpm nx run bot:dev                              # start with nodemon + pino-pretty
pnpm nx run bot:build                            # tsc + tsc-alias → dist/
pnpm nx run bot:start                            # run compiled dist/src/app.js
pnpm nx run bot:test                             # jest --runInBand --coverage
pnpm nx run bot:lint                             # biome check .
pnpm nx run bot:lint-fix                         # biome check . --write

pnpm nx run bot:migrate-up-dev                   # apply all pending migrations
pnpm nx run bot:migrate-down-dev                 # roll back the latest migration
pnpm nx run bot:migrate-create-dev -- <name>     # scaffold a new migration pair
pnpm nx run bot:generate                         # sqlc generate (requires Docker)
```

You can also run scripts directly from `apps/bot/`:

```bash
cd apps/bot
pnpm test
pnpm migrate:status:dev
pnpm migrate:create:dev add_my_table
```

### Utility

```bash
pnpm nx run utility:install   # uv sync
pnpm nx run utility:dev       # uv run fastapi dev main.py  (hot-reload)
pnpm nx run utility:start     # uv run fastapi run main.py  (production)
```

---

## Local database

PostgreSQL 16 via `apps/bot/docker-compose.yaml`:

| Setting | Value |
|---------|-------|
| Host | `localhost:5433` |
| Database | `nugget` |
| User | `nugget` |
| Password | `nugget` |

```bash
docker compose up -d     # start
docker compose down      # stop (data volume persists)
docker compose down -v   # stop and wipe data
```

---

## Database migrations & codegen

Migrations live in `apps/bot/db/migrations/` as paired `*.up.sql` / `*.down.sql` files.

```bash
pnpm nx run bot:migrate-up-dev                   # apply pending
pnpm nx run bot:migrate-down-dev                 # roll back latest
pnpm nx run bot:migrate-create-dev -- my_change  # create new pair
```

After changing schema or SQL queries, regenerate the sqlc bindings:

```bash
pnpm nx run bot:generate
```

Generated files go to `apps/bot/db/sqlcgen/` and are imported directly by repositories. Never edit them manually.

---

## Utility API

The utility service exposes one endpoint:

**`POST /heatmap`** — returns a PNG image

```json
{
  "duples": [[x1, y1], [x2, y2]],
  "resolution": 300,
  "title": "Position Density Heatmap",
  "x_label": "X Coordinate",
  "y_label": "Y Coordinate"
}
```

---

## Architecture (bot)

```
Discord slash command handler
        ↓
    service layer          src/service/
        ↓
  repository layer         src/repository/
        ↓
  sqlcgen queries          db/sqlcgen/   (generated)
        ↓
     PostgreSQL
```

Key directories:

```
apps/bot/
├── src/app.ts                       # composition root
├── src/ui/discord/commands/         # slash command definitions
├── src/ui/discord/handlers/         # interaction dispatcher
├── src/service/                     # domain services (usuarios, partidos, predicciones, awards, timba)
├── src/repository/                  # repository implementations
├── src/interface/                   # TypeScript contracts
├── support/config.ts                # Zod-validated config loader
├── support/db.provider.ts           # DB connection & transaction manager
├── support/pozo.ts                  # prize distribution logic
├── db/migrations/                   # SQL migration files
├── db/sqlcgen/                      # generated query bindings (do not edit)
├── tests/                           # Jest tests
└── docker-compose.yaml              # local Postgres

apps/utility/
├── main.py                          # FastAPI app entry point
└── handlers/heatmap.py              # image generation logic
```

---

## CI

On every push the pipeline runs:

1. `biome ci .` — lint check
2. `pnpm run build` — TypeScript compilation
3. `DISCORD_TOKEN="GENERICO" pnpm run test` — Jest suite

A separate job applies migrations against a Postgres instance on port `5432`.

Docker images are built and pushed only on merges to `main`.

Pre-commit hooks (Lefthook) run `lint → build → test` locally before every commit.
