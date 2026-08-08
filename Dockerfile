# syntax=docker/dockerfile:1

###############################################
# Stage 1 — build
###############################################
FROM node:22-alpine AS build

WORKDIR /app

RUN npm install -g pnpm@9

# Manifests first for layer caching.
# NOTE: destination MUST be a directory ("./"). A file path collapses
# multiple glob matches into one file and corrupts the manifest.
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Vite inlines VITE_* variables at BUILD time — they are not read from
# the container environment at runtime. They must be present here, so
# they are passed as build args by the deployment platform.
#
# Docker warns "SecretsUsedInArgOrEnv" for the anon key. That warning
# does not apply: the Supabase *anon* key is public by design and is
# shipped inside the browser bundle either way. Never pass the
# service_role key here — that one is a real secret and belongs only on
# the backend.
ARG VITE_API_BASE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_TITLE

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_APP_TITLE=${VITE_APP_TITLE}

# Fail early with a clear message rather than shipping a bundle that
# silently points at nothing.
RUN test -n "$VITE_API_BASE_URL" || (echo "ERROR: VITE_API_BASE_URL build arg is required" && exit 1)

# Guard: a Vite build can exit 0 without emitting an entrypoint.
RUN pnpm run build && test -f dist/index.html

###############################################
# Stage 2 — serve
###############################################
FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
