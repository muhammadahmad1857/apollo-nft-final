# syntax=docker/dockerfile:1

FROM node:22-slim AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

ENV NEXT_TELEMETRY_DISABLED=1

# ─────────────────────────────
# DEPENDENCIES
# ─────────────────────────────
FROM base AS deps

# RUN apt-get update && apt-get install -y \
#     openssl \
#     ca-certificates \
#     python3 \
#     make \
#     g++ \
#     && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# IMPORTANT: stop pnpm build-script blocking + allow native deps
# RUN pnpm config set ignore-scripts false 
RUN echo "onlyBuiltDependencies:" > pnpm-workspace.yaml \
 && echo "  - prisma" >> pnpm-workspace.yaml \
 && echo "  - @prisma/engines" >> pnpm-workspace.yaml \
 && echo "  - sharp" >> pnpm-workspace.yaml \
 && echo "  - ffmpeg-static" >> pnpm-workspace.yaml \
 && echo "  - bufferutil" >> pnpm-workspace.yaml \
 && echo "  - utf-8-validate" >> pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# ─────────────────────────────
# BUILD
# ─────────────────────────────
FROM base AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# safety rebuild for sharp + prisma
RUN pnpm rebuild

RUN pnpm build

# ─────────────────────────────
# RUNTIME
# ─────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# copy full next app (NO standalone)
COPY --from=builder /app ./

EXPOSE 4000

CMD ["pnpm", "start"]