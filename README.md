# nugget

This repository is still mostly project scaffolding. The database layer, configuration loading, logging, and a custom SQL migration runner are in place, but the runtime entrypoint at `src/app.ts` is still empty.

## Current status

- Node.js + TypeScript project managed with `pnpm`
- Local PostgreSQL service via Docker Compose
- Custom migration CLI backed by `pg`
- Shared configuration loader with Zod validation
- Shared Pino logger
- Biome linting configured locally and in GitHub Actions
- Build pipeline configured in CI
- App runtime not implemented yet in `src/app.ts`

## Requirements

- Node.js `v24.13.1` (see `.nvmrc`)
- `pnpm` `10.30.1` via Corepack
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
pnpm generate:db
```

### What they do

- `pnpm dev`: runs `nodemon src/app.ts | pino-pretty`
- `pnpm build`: cleans `dist/` and compiles TypeScript with `tsc -p .`
- `pnpm start`: runs the compiled app with `node dist/app.js`
- `pnpm lint`: runs `biome check .`
- `pnpm lint:fix`: runs Biome with `--write`
- `pnpm migrate:*`: executes the custom migration CLI in `cmd/migration.ts`
- `pnpm generate:db`: runs `sqlc generate` inside `db/` using the `sqlc/sqlc` Docker image

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

The current config schema is:

```yaml
database:
  url: postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
discord:
  token: <discord bot token>
```

Environment variables are expanded by splitting keys on underscores, so these map into the nested config:

```bash
DATABASE_URL=postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
DISCORD_TOKEN=your-token-here
```

> `support/config.ts` currently requires `discord.token` to be non-empty after validation, even though `src/app.ts` does not yet use it.

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

The current initial migration enables the PostgreSQL `uuid-ossp` extension, and the down migration drops it.

## Project structure

```text
.
├── cmd/migration.ts       # custom migration CLI entrypoint
├── db/migrations/         # raw SQL migrations
├── src/app.ts             # runtime entrypoint (currently empty)
├── support/config.ts      # config loading and validation
├── support/logger.ts      # shared pino logger
├── docker-compose.yaml    # local Postgres service
├── biome.json             # lint/format config
└── .github/workflows/     # CI build and lint workflows
```

## CI

GitHub Actions currently runs:

- `pnpm install` + `pnpm run build`
- `biome ci .`

Node is taken from `.nvmrc` in CI.

## Notes

- `tsconfig.json` uses `rootDirs: ["cmd", "src"]`, so executable TypeScript is expected under both trees.
- `package.json` pulls `sqlc/sqlc:latest` during `pnpm install` via the `preinstall` hook.
- If you run `pnpm dev` today, it starts from `src/app.ts`, which is still empty.
