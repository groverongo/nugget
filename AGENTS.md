# AGENTS.md

## Snapshot
- `src/app.ts` is still empty. Do not assume there is an existing Discord bot flow or runtime wiring to extend.
- The repo is no longer just scaffolding: core domain logic lives under `src/service`, `src/repository`, `src/interface`, and `support`, with generated SQL bindings in `db/sqlcgen`.

## Setup that matters
- Use Node `v24.13.1` from `.nvmrc` and `pnpm@10.30.1` via Corepack.
- `pnpm install` also runs the `preinstall` hook `docker pull sqlc/sqlc:latest`, so dependency install expects Docker to be available.
- Local Postgres comes from `docker-compose.yaml` and binds `localhost:5433` with database/user/password all set to `nugget`.
- Run repo commands from the repo root. Both the migration CLI and config loader resolve paths from `process.cwd()`.
- Normal local boot sequence is: `corepack enable` -> `pnpm install` -> `docker compose up -d` -> `pnpm migrate:up` -> `pnpm dev`.

## Commands and verification
- `pnpm dev` runs `nodemon src/app.ts | pino-pretty`.
- `pnpm build` is the real typecheck/build step: `pnpm clean && tsc -p .`.
- `pnpm lint` runs `biome check .`; `pnpm lint:fix` adds `--write`.
- Pre-commit runs `pnpm lint` and then `pnpm build`; keep that order for focused local verification.
- There is no dedicated test script yet.

## Database and codegen
- Migration commands all go through `ts-node ./cmd/migration.ts` (`migrate:up`, `migrate:down`, `migrate:status`, `migrate:create`).
- The migration runner reads `db/migrations` from `process.cwd()`, creates `schema_migrations` if needed, and wraps each up/down migration in a transaction.
- `migrate:down` only rolls back the latest applied migration; there is no built-in rollback-to-version flow.
- Use `pnpm migrate:create <name>` instead of hand-creating filenames; the CLI lowercases the name, replaces spaces/hyphens with underscores, and prefixes a UTC timestamp.
- SQL codegen is configured in `db/sqlc.yaml`; run `pnpm generate:db` from the repo root. It uses the Dockerized `sqlc` image and writes generated files to `db/sqlcgen`.
- `db/sqlcgen` is excluded from Biome, so do not infer formatting/lint conventions from generated output.
- Repositories and services import generated query bindings directly from `db/sqlcgen`, so regenerate after schema/query changes before trusting TypeScript errors.

## Config and style gotchas
- `support/config.ts` loads config in this order: built-in defaults -> optional `config.yaml` -> environment variables. In non-production, it auto-loads `.env` first.
- Environment variables are expanded by splitting on underscores, so `DATABASE_URL=...` maps to `config.database.url`.
- Config validation requires both `discord.token` and the numeric `polla.*` settings. Env overrides arrive as strings, so numeric values need parsing somewhere other than `support/config.ts` if you add new numeric env-driven config.
- `tsconfig.json` uses `rootDirs: ["cmd", "src"]`, so executable TS is expected in both trees.
- Biome enforces tabs, double quotes, and `noConsole`; use the shared Pino logger instead of `console.*`.

## Where to look first
- For DB-related changes, read `cmd/migration.ts`, `support/config.ts`, `db/migrations/*`, and `db/sqlc.yaml` together.
- For application logic, start with `src/service/usuarios.service.ts`, `src/repository/*.ts`, `support/db.provider.ts`, and `support/pozo.ts`; `src/app.ts` does not wire them up yet.
