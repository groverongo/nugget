# -------------------------
# Base image
# -------------------------
FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /bot

# -------------------------
# Dependencies
# -------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --ignore-scripts

# -------------------------
# Build
# -------------------------
FROM deps AS build

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY db ./db
COPY src ./src
COPY support ./support
RUN pnpm build

# -------------------------
# Production dependencies
# -------------------------
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# -------------------------
# Runtime
# -------------------------
FROM node:24-alpine AS runner

ENV NODE_ENV=production

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /bot

COPY --from=prod-deps /bot/node_modules ./node_modules
COPY --from=build /bot/dist ./dist
COPY package.json ./

CMD ["node", "dist/src/app.js"]