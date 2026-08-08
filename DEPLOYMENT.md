# Dokploy Deployment (branch: `stagging`)

Deployment fixes so this app builds and runs on Dokploy without any
platform-side file patches.

## What was broken on `main`, and what changed here

| # | Problem on `main` | Fix in this branch |
|---|---|---|
| 1 | Both `Dockerfile` stages pulled from an internal corporate registry, unreachable from any external host. | Public `node:22-alpine` / `nginx:1.27-alpine`. |
| 2 | The build ran `pnpm run build:$mode` (or `build:development`), but **no such scripts exist** in `package.json` — only `build`. The image could never build. | Calls `pnpm run build`. |
| 3 | `pnpm config set @pegadaian:registry ...` pointed at an unreachable internal registry. | Removed; uses the public registry from `.npmrc`. |
| 4 | `COPY package.json ./` omitted the lockfile, so `pnpm install` resolved fresh versions on every build — non-reproducible. | Copies `pnpm-lock.yaml` and uses `--frozen-lockfile`. |
| 5 | No `VITE_*` values were supplied at build time. Vite inlines these during build, so the bundle shipped pointing at nothing. | Declared as `ARG`s and validated. |
| 6 | The nginx stage copied files but shipped **no config** — so Vue Router deep links (`/dashboard`) returned 404 on refresh. | Adds `nginx.conf` with SPA history fallback. |
| 7 | `dist` was commented out of `.dockerignore` while a stale `dist/` sat committed in the repo, so old build output entered the build context. | `dist` ignored. |
| 8 | A locally generated `pnpm-workspace.yaml` (from newer pnpm) entering the build context makes pnpm treat the app as a workspace root and abort with `packages field missing or empty`. | Ignored in `.dockerignore`. |

Also added: multi-stage build, `HEALTHCHECK`, gzip, long-lived caching
for hashed assets with `no-store` on `index.html`, and a
`docker-compose.yml`.

## Environment variables — read this before deploying

**Vite inlines `VITE_*` at BUILD time.** They are *not* read from the
container environment at runtime. Setting them in Dokploy's
**Environment** tab alone has no effect on the bundle — they must be
passed as **build args**.

Changing any of them requires a **rebuild**, not a restart.

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | **Origin only — no path.** |
| `VITE_SUPABASE_URL` | Must match the backend's Supabase project. |
| `VITE_SUPABASE_ANON_KEY` | Public by design; safe in the bundle. |
| `VITE_APP_TITLE` | Optional. |

### `VITE_API_BASE_URL` must not include `/api/v1`

`src/lib/api/client.ts` appends the `/api/v1` prefix itself:

```ts
const baseURL = baseAPIBase ? `${baseAPIBase.replace(/\/$/, "")}${apiPrefix}` : baseAPIBase;
```

```
correct   https://api-alir.niflheim.web.id
wrong     https://api-alir.niflheim.web.id/api/v1   → requests hit /api/v1/api/v1/... and 404
```

### Supabase project must match the backend

The backend validates incoming JWTs against its own Supabase project.
If this app authenticates against a *different* project, every token it
issues is rejected — typically surfacing as blanket `401`s after an
apparently successful login. Confirm both sides use the same
`project-ref`.

### Never ship the service_role key

Only the **anon** key belongs in a browser bundle. The `service_role`
key bypasses row-level security and must stay on the backend.

## Deploying on Dokploy

1. **Provider** → GitHub → this repo, branch **`stagging`**
2. **Build Path** → `/`
3. **Build Type** → **Dockerfile**
4. **Build Args** → set every `VITE_*` value listed above
   *(Build Args, not Environment — see the note above.)*
5. **Advanced → Ports** → Published `7002`, Target `80`, Mode `host`
   *(or add a Domain and let Traefik handle TLS)*
6. **Deploy**

nginx listens on **80** inside the container; the published host port is
what an external proxy such as Cloudflare should target.

## Verifying a deploy

```bash
curl -fsS https://<your-domain>/                 # 200
curl -fsS https://<your-domain>/dashboard        # 200 — SPA fallback, not 404
curl -so /dev/null -w '%{http_code}\n' https://<your-domain>/assets/nope.js   # 404
```

Confirm the bundle points at the intended API:

```bash
docker exec <container> grep -rl "api-alir" /usr/share/nginx/html/assets/
```

If that returns nothing, the build args did not reach the build.

## Local development

```bash
pnpm install
cp .env.example .env      # fill in real values (never commit this file)
pnpm dev
```

Build exactly as the image does:

```bash
pnpm run build && ls -la dist/index.html
```
