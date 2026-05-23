# nugget

Right now this repository is mostly project scaffolding: TypeScript tooling, configuration loading, PostgreSQL setup, and a custom SQL migration runner are in place, but the runtime entrypoint at `src/app.ts` is still empty.

## Current status

- Node.js + TypeScript project managed with `pnpm`
- Local PostgreSQL service via Docker Compose
- Custom migration CLI backed by `pg`
- Biome linting configured locally and in GitHub Actions
- Build pipeline configured in CI
- App implementation not started yet in `src/app.ts`

## Requirements

- Node.js `v24.13.1` (see `.nvmrc`)
- `pnpm` `10.30.1` or compatible via Corepack
- Docker + Docker Compose for local PostgreSQL

## Quick start

```bash
corepack enable
pnpm install
docker compose up -d
pnpm migrate:up
pnpm dev
```

## Available scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm lint:fix
pnpm migrate:up
pnpm migrate:down
pnpm migrate:status
pnpm migrate:create <name>
```

### What they do

- `pnpm dev`: runs `nodemon src/app.ts | pino-pretty`
- `pnpm build`: cleans `dist/` and compiles TypeScript with `tsc -p .`
- `pnpm start`: runs the compiled app with `node dist/app.js`
- `pnpm lint`: runs `biome check .`
- `pnpm lint:fix`: runs Biome with `--write`
- `pnpm migrate:*`: executes the custom migration CLI in `cmd/migration/migration.ts`

## Local database

`docker-compose.yaml` provisions a local PostgreSQL 16 container with these defaults:

- container name: `nugget-postgres`
- database: `nugget`
- user: `nugget`
- password: `nugget`
- host port: `5433`

Default connection string from `support/config.ts`:

```text
postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
```

## Configuration

Configuration is validated with Zod and loaded in this order:

1. internal defaults
2. optional `config.yaml`
3. environment variables

In non-production environments, `.env` is loaded automatically through `dotenv`.

The config shape currently expected by the app is:

```yaml
database:
  url: postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
```

Environment variables are expanded by splitting keys on underscores, so this works:

```bash
DATABASE_URL=postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
```

## Migrations

Migrations live under `db/migrations` as paired files:

- `*.up.sql`
- `*.down.sql`

The migration runner:

- creates `schema_migrations` if needed
- applies pending migrations in order
- wraps each migration in a transaction
- can roll back the latest applied migration

Example flow:

```bash
pnpm migrate:status
pnpm migrate:create add_users_table
pnpm migrate:up
pnpm migrate:down
```

Current initial migration only enables the PostgreSQL `uuid-ossp` extension.

## Project structure

```text
.
├── cmd/migration/        # custom migration CLI
├── db/migrations/        # raw SQL migrations
├── src/                  # application runtime entrypoint
├── support/config.ts     # config loading and validation
├── support/logger.ts     # shared pino logger
├── docker-compose.yaml   # local Postgres service
├── biome.json            # lint/format config
└── .github/workflows/    # CI build and lint workflows
```

## CI

GitHub Actions currently runs:

- `pnpm install` + `pnpm run build`
- `biome ci .`

Node is taken from `.nvmrc` in CI as well.

## Important note

The repository is prepared to host the bot, but the actual bot behavior has not been implemented yet. If you run `pnpm dev` today, it will start from `src/app.ts`, which is currently empty.
