# AGENTS.md

## Snapshot
- This repo is still mostly scaffold. `src/app.ts` is empty, so do not assume there is an implemented bot runtime yet.
- The most complete working code today is the migration CLI in `cmd/migration.ts` plus shared utilities in `support/`.

## Environment and setup
- Use Node `v24.13.1` from `.nvmrc`.
- Package manager is `pnpm@10.30.1`.
- Local Postgres comes from `docker-compose.yaml` and binds `localhost:5433` with database/user/password all set to `nugget`.
- Normal local boot sequence is: `corepack enable` -> `pnpm install` -> `docker compose up -d` -> `pnpm migrate:up` -> `pnpm dev`.

## Commands that matter
- `pnpm dev` runs `nodemon src/app.ts | pino-pretty`.
- `pnpm build` runs `pnpm clean && tsc -p .` and writes to `dist/`.
- `pnpm start` runs `node dist/app.js`.
- `pnpm lint` runs `biome check .`.
- `pnpm lint:fix` runs `biome check . --write`.
- Migration commands all go through `ts-node ./cmd/migration.ts`:
  - `pnpm migrate:up`
  - `pnpm migrate:down`
  - `pnpm migrate:status`
  - `pnpm migrate:create <name>`

## Verification expectations
- Pre-commit runs `pnpm lint` and then `pnpm build`; keep that order when doing focused local verification.
- CI enforces Biome with `biome ci .` and a separate build job with `pnpm install` + `pnpm run build`.
- There is no dedicated `test` or `typecheck` script right now; `tsc -p .` inside `pnpm build` is the verified type-check/build path.

## Code layout
- `src/` is the runtime app area, but right now `src/app.ts` is empty.
- `cmd/` holds executable command entrypoints; the migration CLI is the main implemented entrypoint.
- `support/config.ts` is the central configuration loader.
- `support/logger.ts` exports the shared Pino logger.
- SQL migrations live in `db/migrations` as paired `*.up.sql` and `*.down.sql` files.

## Repo-specific gotchas
- `tsconfig.json` uses `rootDirs: ["cmd", "src"]`, so executable TS code is expected under both trees.
- Config loading order is: built-in defaults -> optional `config.yaml` -> environment variables.
- In non-production environments, `.env` is auto-loaded via `dotenv`.
- Environment variables are expanded into nested config by splitting names on underscores, so `DATABASE_URL=...` maps to `database.url`.
- Biome is configured for tabs, double quotes, and `noConsole` as an error. Prefer the shared Pino logger over `console.*`.

## Change guidance
- If you are asked to add runtime behavior, expect to build it from `src/app.ts` outward rather than extending existing app flow.
- If you touch database behavior, inspect `cmd/migration.ts`, `support/config.ts`, and the relevant files in `db/migrations` together; they are the current source of truth for DB setup.
