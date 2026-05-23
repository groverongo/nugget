# AGENTS.md

## Snapshot
- The runtime app is still unimplemented: `src/app.ts` is empty. Do not assume there is an existing bot flow to extend.
- The only real execution path today is the migration CLI in `cmd/migration.ts`, backed by `support/config.ts` and `support/logger.ts`.

## Setup that matters
- Use Node `v24.13.1` from `.nvmrc` and `pnpm@10.30.1` via Corepack.
- `pnpm install` also runs the `preinstall` hook `docker pull sqlc/sqlc:latest`, so dependency install expects Docker to be available.
- Local Postgres comes from `docker-compose.yaml` and binds `localhost:5433` with database/user/password all set to `nugget`.
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
- SQL codegen is configured in `db/sqlc.yaml`; run `pnpm generate:db` from the repo root. It uses the Dockerized `sqlc` image and writes generated files to `db/sqlcgen`.
- `db/sqlcgen` is excluded from Biome, so do not infer formatting/lint conventions from generated output.

## Config and style gotchas
- `support/config.ts` loads config in this order: built-in defaults -> optional `config.yaml` -> environment variables. In non-production, it auto-loads `.env` first.
- Environment variables are expanded by splitting on underscores, so `DATABASE_URL=...` maps to `config.database.url`.
- The config schema already requires `discord.token`; runtime work that loads config will need that value even though the app entrypoint is still empty.
- `tsconfig.json` uses `rootDirs: ["cmd", "src"]`, so executable TS is expected in both trees.
- Biome enforces tabs, double quotes, and `noConsole`; use the shared Pino logger instead of `console.*`.

## Where to look first
- For DB-related changes, read `cmd/migration.ts`, `support/config.ts`, `db/migrations/*`, and `db/sqlc.yaml` together.
- For runtime behavior, start at `src/app.ts` and expect to build outward rather than plugging into existing application structure.
