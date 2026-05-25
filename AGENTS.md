# AGENTS.md

## Repo reality check
- `src/app.ts` is **not** empty anymore. It currently acts as a composition root that builds the DB, transaction manager, repositories, and `UsuariosService`, but it still does **not** wire a Discord.js bot runtime yet.
- Core logic worth extending lives under `src/service`, `src/repository`, `src/interface`, and `support`. Generated SQL bindings live in `db/sqlcgen` and are used directly by repositories/services.

## Setup and command order
- Use Node `v24.13.1` from `.nvmrc` and `pnpm@10.30.1` via Corepack.
- `pnpm install:images` runs `docker pull sqlc/sqlc:latest` as a hook, so Docker must already be available even for dependency install.
- Local Postgres comes from `docker-compose.yaml` and binds `localhost:5433` with database/user/password all set to `nugget`.
- Run repo commands from the repo root. Both `cmd/migration.ts`, `cmd/seeding.ts`, and `support/config.ts` resolve paths from `process.cwd()`.
- Normal local boot order is: `corepack enable` -> `pnpm install` -> `docker compose up -d` -> `pnpm migrate:up` -> `pnpm dev`.

## Verification commands
- `pnpm lint` runs `biome check .`.
- `pnpm build` is the real typecheck/build step: `pnpm clean && tsc -p .`.
- `pnpm test` exists now and runs `jest --runInBand --coverage`; Jest is configured to look only under `tests/`.
- The local pre-commit hook runs `pnpm lint` and then `pnpm build`; keep that order for focused verification.
- CI does build and lint separately: build uses `pnpm install && pnpm run build`, while lint uses `biome ci .` directly.

## Database, seeds, and codegen
- Migration commands all go through `ts-node ./cmd/migration.ts` (`migrate:up`, `migrate:down`, `migrate:status`, `migrate:create`).
- `migrate:down` only rolls back the latest applied migration; there is no rollback-to-version flow.
- Use `pnpm migrate:create <name>` instead of hand-creating filenames; the CLI normalizes the name and timestamps it.
- `pnpm seed` runs `cmd/seeding.ts` and expects JSON seed files under `db/seed` from the repo root.
- SQL codegen is configured in `db/sqlc.yaml`; run `pnpm generate:db` from the repo root. It uses Dockerized `sqlc` and writes output to `db/sqlcgen`.
- After changing migrations or SQL queries, regenerate `db/sqlcgen` before trusting TypeScript errors.
- `db/sqlcgen` is excluded from Biome, so do not infer source formatting conventions from generated files.

## Config and style gotchas
- `support/config.ts` loads config in this order: built-in defaults -> optional `config.yaml` -> environment variables. In non-production, it auto-loads `.env` first.
- Environment variables are expanded by splitting keys on underscores, so `DATABASE_URL=...` maps to `config.database.url`.
- Config validation requires both `discord.token` and numeric `polla.*` settings. Env overrides arrive as strings, so new numeric env-driven config needs explicit parsing somewhere other than the current env loader.
- Biome enforces tabs, double quotes, and `noConsole`; use the shared Pino logger instead of `console.*`.

## Where to look first
- For DB workflow changes: read `cmd/migration.ts`, `cmd/seeding.ts`, `support/config.ts`, `db/sqlc.yaml`, and the relevant files under `db/migrations` together.
- For application logic: start with `src/app.ts`, `src/service/usuarios.service.ts`, `src/repository/*.ts`, `support/db.provider.ts`, and `support/pozo.ts`.
