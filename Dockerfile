# Mizan production image: long-running Next.js + SQLite file (optional local/VPS).
# For $0 public hosting with the PC off, prefer Vercel + Turso instead.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The public address is written into the static landing and calculator pages
# (canonical links, social cards), so it is needed at build time:
#   docker build --build-arg APP_URL=https://mizan.example .
ARG APP_URL=""
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
ARG NEXT_PUBLIC_PLAUSIBLE_SRC=""
ENV APP_URL=$APP_URL \
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN=$NEXT_PUBLIC_PLAUSIBLE_DOMAIN \
    NEXT_PUBLIC_PLAUSIBLE_SRC=$NEXT_PUBLIC_PLAUSIBLE_SRC
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/mizan-build.db
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/data/mizan.db

# No init process is installed: the entrypoint execs node, and Next's server
# handles SIGTERM itself, so `docker stop` shuts it down cleanly. (Compose
# also sets `init: true`.)
RUN groupadd --system --gid 1001 mizan \
  && useradd --system --uid 1001 --gid mizan mizan \
  && mkdir -p /data \
  && chown mizan:mizan /data

# The standalone build carries the server and the database client it uses.
# The migration and password-reset scripts also need drizzle-orm and
# bcryptjs, neither of which has dependencies of its own, so only those two
# are copied in rather than installing every package a second time.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder --chmod=755 /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY --from=builder /app/scripts/migrate.cjs /app/scripts/reset-password.cjs ./scripts/

# The app's files stay root-owned and read-only to it. Only the data volume
# and Next's cache (where hourly price lookups are kept) are writable.
RUN mkdir -p /app/.next/cache && chown mizan:mizan /app/.next/cache

USER mizan
EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["./scripts/docker-entrypoint.sh"]
