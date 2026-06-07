# AGENTS.md

## Repo reality check
- `src/app.ts` is both the composition root and the current runtime entrypoint. It builds the DB/transaction layer, repositories, and `UsuariosService`, then boots a minimal Discord.js client with a `!ping -> pong` handler.
- Extend domain behavior under `src/service`, `src/repository`, `src/interface`, and `support`. SQL bindings in `db/sqlcgen` are generated and imported directly by repositories.

## Setup and command order
- Use Node `v24.13.1` from `.nvmrc` and `pnpm@10.30.1` via Corepack.
- `pnpm install:images` runs `docker pull sqlc/sqlc:latest` as a hook, so Docker must already be available even for dependency install.
- Local Postgres comes from `docker-compose.yaml` and binds `localhost:5433` with database/user/password all set to `nugget`.
- Run repo commands from the repo root. Both `cmd/migration.ts`, `cmd/seeding.ts`, and `support/config.ts` resolve paths from `process.cwd()`.
- Normal local boot order is: `corepack enable` -> `pnpm install` -> `docker compose up -d` -> `pnpm migrate:up` -> `pnpm dev`.
- `pnpm dev` logs into Discord immediately via `config.discord.token`; it is not a pure local composition test.

## Verification commands
- `pnpm lint` runs `biome check .`.
- `pnpm build` is the real typecheck/build step: `pnpm clean && tsc && tsc-alias`.
- `pnpm test` exists now and runs `jest --runInBand --coverage`; Jest is configured to look only under `tests/`.
- Lefthook pre-commit runs `pnpm lint`, `pnpm build`, and `pnpm test` in that order.
- CI runs `biome ci .`, then `pnpm run build`, then `DISCORD_TOKEN="GENERICO" pnpm run test`; a separate job applies migrations against Postgres on port `5432`.

## Database, seeds, and codegen
- Migration commands all go through `ts-node ./cmd/migration.ts` (`migrate:up`, `migrate:down`, `migrate:status`, `migrate:create`).
- `migrate:down` only rolls back the latest applied migration; there is no rollback-to-version flow.
- Use `pnpm migrate:create <name>` instead of hand-creating filenames; the CLI normalizes the name and timestamps it.
- `pnpm seed` runs `cmd/seeding.ts` and expects JSON seed files under `db/seed` from the repo root.
- Seed files are loaded alphabetically from `db/seed`; each JSON file must declare one table, rows with identical columns, and optional refs metadata.
- SQL codegen is configured in `db/sqlc.yaml`; run `pnpm generate:db` from the repo root. It uses Dockerized `sqlc` and writes output to `db/sqlcgen`.
- After changing migrations or SQL queries, regenerate `db/sqlcgen` before trusting TypeScript errors.
- `db/sqlcgen` is excluded from Biome, so do not infer source formatting conventions from generated files.

## Config and style gotchas
- `support/config.ts` loads config in this order: built-in defaults -> optional `config.yaml` -> environment variables. In non-production, it auto-loads `.env` first.
- Environment variables are expanded by splitting keys on underscores, so `DATABASE_URL=...` maps to `config.database.url`.
- Config validation requires both `discord.token` and numeric `polla.*` settings. Env overrides arrive as strings, so new numeric env-driven config needs explicit parsing somewhere other than the current env loader.
- Biome enforces tabs, double quotes, and `noConsole`; use the shared Pino logger instead of `console.*`.
- `tsconfig.json` path aliases only define `@sqlc/*` and `@support/*`; everything else is imported relatively.
- `pnpm start` runs `node dist/src/app.js` (not `dist/app.js`).
- `config.yaml` currently contains a real Discord token. Treat it as a secret leak and never copy it into docs, logs, commits, or test output.

## Where to look first
- For DB workflow changes: read `cmd/migration.ts`, `cmd/seeding.ts`, `support/config.ts`, `db/sqlc.yaml`, and the relevant files under `db/migrations` together.
- For application logic: start with `src/app.ts`, `src/service/usuarios.service.ts`, `src/repository/*.ts`, `support/db.provider.ts`, and `support/pozo.ts`.
- For tests: `tests/usuarios.service.test.ts` is the only current suite; it is a service-unit test with repository/transaction mocks rather than a DB integration test.
