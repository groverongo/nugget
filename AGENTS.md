# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->

---

## Workspace overview

This is an Nx monorepo with two apps:

- **`apps/bot`** — TypeScript/Node.js Discord bot (pnpm, Jest, Biome, PostgreSQL via sqlc)
- **`apps/utility`** — Python FastAPI service for graphic generation (uv, matplotlib/seaborn/scipy)

Each app has its own `package.json` / `pyproject.toml` and is independently deployable via Docker. The root has no `package.json`; all JS deps are scoped to `apps/bot`.

---

## Common commands

All tasks run through Nx from the workspace root:

```bash
# bot
pnpm nx run bot:dev          # start Docker Compose + nodemon (needs Discord token)
pnpm nx run bot:build        # tsc + tsc-alias → dist/
pnpm nx run bot:test         # jest --runInBand --coverage
pnpm nx run bot:lint         # biome check .
pnpm nx run bot:lint-fix     # biome check . --write
pnpm nx run bot:migrate-up-dev
pnpm nx run bot:migrate-down-dev
pnpm nx run bot:migrate-create-dev   # append name arg via --args="-- <name>"
pnpm nx run bot:generate     # sqlc generate (requires Docker)

# utility
pnpm nx run utility:dev      # uv run fastapi dev main.py
pnpm nx run utility:start    # uv run fastapi run main.py
pnpm nx run utility:install  # uv sync
```

For the bot, commands can also be run directly from `apps/bot/`:

```bash
cd apps/bot
pnpm test                    # run all tests
pnpm test -- --testPathPattern=usuarios   # run a single test file
pnpm migrate:status:dev
```

---

## Bot architecture (`apps/bot`)

`src/app.ts` is the composition root. It wires all dependencies and boots the Discord.js client.

**Call chain (strict — never skip layers):**
```
Discord slash command handler → service → repository → db/sqlcgen query
```

Key directories:
- `src/ui/discord/commands/` — slash command definitions and registration
- `src/ui/discord/handlers/interactions.ts` — interaction dispatcher
- `src/ui/discord/services/client.ts` — Discord.js client setup and event binding
- `src/service/` — domain services (usuarios, partidos, predicciones, admin, awards, timba)
- `src/repository/` — concrete repository implementations wrapping sqlcgen
- `src/interface/` — TypeScript contracts for services and repositories
- `support/config.ts` — Zod-validated config (defaults → config.yaml → env vars)
- `support/db.provider.ts` — DB connection and transaction manager
- `support/pozo.ts` — prize distribution logic
- `db/migrations/` — paired `*.up.sql` / `*.down.sql` files
- `db/sqlcgen/` — generated SQL bindings (never edit manually; excluded from Biome)

**Path aliases:** only `@sqlc/*` and `@support/*` are defined; everything else is imported relatively.

**Config:** loaded in order: built-in defaults → `config.yaml` → env vars. In non-prod, `.env` is auto-loaded first. Numeric `polla.*` settings require explicit string-to-number parsing if added via env vars.

**Local DB:** Postgres 16 via `docker-compose.yaml` at `localhost:5433`, database/user/password all `nugget`.

**Lefthook pre-commit:** runs `pnpm lint` → `pnpm build` → `pnpm test` in order.

**CI:** `biome ci .` → `pnpm build` → `DISCORD_TOKEN="GENERICO" pnpm test`; a separate job runs migrations against Postgres on port `5432`. Docker images are pushed only on pushes to `main`.

After changing migrations or SQL queries, regenerate bindings: `pnpm nx run bot:generate`.

---

## Utility architecture (`apps/utility`)

FastAPI app managed with `uv`. Single endpoint:

- `POST /heatmap` — accepts coordinate pairs + display options, returns a PNG image via `StreamingResponse`

Handler logic lives in `handlers/heatmap.py` (`diagrama_predicciones` function). Dependencies: matplotlib, seaborn, scipy, numpy.