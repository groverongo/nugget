# nugget

`nugget` is a Node.js + TypeScript project for managing the core domain behind a Discord-driven polla workflow. The repository already includes domain services, repository abstractions, SQL-backed persistence, migrations, generated query bindings, and a lightweight application composition root.

The Discord bot runtime is not wired yet, but `src/app.ts` is no longer empty: it builds the application context and composes the current repositories and services.

## Current status

- Node.js + TypeScript project managed with `pnpm`
- Local PostgreSQL service via Docker Compose
- Custom migration CLI backed by `pg`
- SQL code generation with `sqlc` into `db/sqlcgen`
- Repository + service layers for usuarios and static prize distribution data
- Shared configuration loader with Zod validation
- Shared Pino logger
- Jest-based service tests
- Biome linting configured locally and in GitHub Actions
- Build and lint pipelines configured in CI

## Requirements

- Node.js `v24.13.1` (see `.nvmrc`)
- `pnpm` `10.30.1` via Corepack
- Docker + Docker Compose

## Quick start

```bash
corepack enable
pnpm install
docker compose up -d
pnpm migrate:up
pnpm dev
```

### Notes about setup

- `pnpm install` runs a `preinstall` hook that pulls `sqlc/sqlc:latest`, so Docker must be available during dependency installation.
- Commands should be run from the repo root because the migration runner and config loader resolve paths from `process.cwd()`.
- The app config requires `discord.token` plus the numeric `polla.*` settings after validation.

## Available scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm lint
pnpm lint:fix
pnpm migrate:up
pnpm migrate:down
pnpm migrate:status
pnpm migrate:create <name>
pnpm seed
pnpm generate:db
pnpm generate
```

### What they do

- `pnpm dev`: runs `nodemon src/app.ts | pino-pretty`
- `pnpm build`: cleans `dist/` and compiles TypeScript with `tsc -p .`
- `pnpm start`: runs the compiled app with `node dist/app.js`
- `pnpm test`: runs Jest in-band with coverage enabled
- `pnpm lint`: runs `biome check .`
- `pnpm lint:fix`: runs Biome with `--write`
- `pnpm migrate:*`: executes the custom migration CLI in `cmd/migration.ts`
- `pnpm seed`: runs the seeding entrypoint in `cmd/seeding.ts`
- `pnpm generate:db`: runs `sqlc generate` inside `db/` using the `sqlc/sqlc` Docker image
- `pnpm generate`: alias for `pnpm run generate:db`

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

In non-production environments, `.env` is loaded automatically through `dotenv` before `config.yaml` and environment overrides are merged.

The current config shape is:

```yaml
database:
  url: postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
discord:
  token: <discord bot token>
polla:
  costo_entrada: 100
  fraccion_comision_org: 0.1
  fraccion_extra_campeon: 0.25
  factor_bloque_maximo: 10
```

Environment variables are expanded by splitting keys on underscores, so these map into the nested config:

```bash
DATABASE_URL=postgres://nugget:nugget@localhost:5433/nugget?sslmode=disable
DISCORD_TOKEN=your-token-here
POLLA_COSTO_ENTRADA=100
POLLA_FRACCION_COMISION_ORG=0.1
POLLA_FRACCION_EXTRA_CAMPEON=0.25
POLLA_FACTOR_BLOQUE_MAXIMO=10
```

> `support/config.ts` validates `polla.*` as numbers. Environment variables arrive as strings, so any new numeric env-driven config needs explicit parsing somewhere in the loading path.

## Migrations and code generation

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

Current migrations cover the base setup plus domain tables for usuarios, premios, and torneo-related data.

`sqlc` configuration lives in `db/sqlc.yaml`. Generated query bindings are written to `db/sqlcgen`, and repositories import those generated functions directly. After changing schema or query files, regenerate bindings before trusting TypeScript errors:

```bash
pnpm generate:db
```

## Application structure

`src/app.ts` currently acts as a composition root. It creates:

- a shared database connection
- a transaction manager
- `UsuariosRepository`
- `EstaticoRepository`
- `UsuariosService`

The main runtime still stops at context creation, and the Discord.js bot definition is still marked as TODO.

`UsuariosService` is the main implemented domain service right now. It coordinates user creation/deletion with transactional prize distribution recalculation using repository interfaces and `support/pozo.ts`.

## Project structure

```text
.
├── cmd/migration.ts                # custom migration CLI entrypoint
├── cmd/seeding.ts                  # seed runner
├── db/migrations/                  # raw SQL migrations
├── db/sqlc.yaml                    # sqlc configuration
├── db/sqlcgen/                     # generated SQL bindings
├── src/app.ts                      # application composition root
├── src/repository/                 # concrete repository implementations
├── src/service/                    # domain services
├── src/interface/                  # repository/service contracts
├── support/config.ts               # config loading and validation
├── support/db.provider.ts          # DB connection and transaction helpers
├── support/logger.ts               # shared pino logger
├── support/pozo.ts                 # prize distribution logic
├── tests/                          # Jest tests
├── docker-compose.yaml             # local Postgres service
├── biome.json                      # lint/format config
└── .github/workflows/              # CI build and lint workflows
```

## Testing and verification

- `pnpm test` runs the current Jest suite, including `tests/usuarios.service.test.ts`
- `pnpm lint` runs Biome checks
- `pnpm build` is the main TypeScript verification step

The pre-commit flow is effectively `pnpm lint` followed by `pnpm build`, which matches the repo’s expected local verification order.

## CI

GitHub Actions currently runs:

- `pnpm install` + `pnpm run build`
- `biome ci .`

Node is taken from `.nvmrc` in CI.

## Notes

- `tsconfig.json` uses `rootDirs: ["cmd", "src", "tests"]`, so executable TypeScript is expected across command, app, and test trees.
- `db/sqlcgen` is excluded from Biome, so formatting there should not be treated as a source-style reference.
- If you are changing database schema or SQL queries, update migrations and regenerate SQL bindings together.
