# App Loading Screen (Cold Start)

## Purpose

On cold start, the app currently shows a blank white page (`<div id="app">` with no content) while `router.beforeEach` awaits `authStore.initializeAuth()` before resolving the first navigation. This is a network round trip (Supabase session check) with no visual feedback.

Add a branded loading screen that covers this gap — shown once per session, from mount until the first route resolves, then replaced permanently by the app.

## Trigger

Cold start only: the screen is visible from app mount until the router's first navigation finishes resolving (which includes the auth check). It never reappears during normal in-app navigation, including navigating to `/login` after a logout.

## Components

### `src/components/ui/states/AppLoadingScreen.vue` (new)

A full-screen, non-interactive overlay:

- Background: solid white (`#FFFFFF`), matching the app's light surface token.
- Centered content: the ALIR monogram mark — the same rounded-square gradient badge (`linear-gradient(135deg, #1E40AF 0%, #2563EB 55%, #14B8A6 100%)`) with the RFID glyph used on the login page — at a larger size (e.g. 64px) than its login-page usage (40px).
- Animation: a subtle CSS pulse/fade (`@keyframes`) on the mark — opacity and/or scale oscillating gently (no spinner, no progress bar, no text).
- No props, no slots — it's a static presentational component.

### `src/App.vue` (modified)

```ts
const appReady = ref(false);
router.isReady().then(() => {
    appReady.value = true;
});
```

Template renders `<AppLoadingScreen v-if="!appReady" />` and otherwise `<router-view />`. `useTheme()` call stays as-is.

## Data Flow

1. `main.ts` creates the app, mounts it, and fires `bootstrapAuth()` (unchanged).
2. `App.vue` mounts with `appReady = false` → `AppLoadingScreen` renders immediately.
3. Vue Router resolves its first navigation; `router.beforeEach` (unchanged) awaits `authStore.initializeAuth()` as part of that resolution.
4. `router.isReady()` resolves right after that first navigation completes → `appReady = true`.
5. `AppLoadingScreen` unmounts, `router-view` renders the resolved route (`/login` or an authenticated route, per existing guard logic).

No changes to `router/index.ts` or `auth.store.ts` — this only consumes the existing `router.isReady()` signal.

## Error Handling

`initializeAuth()` failures are already caught in `router.beforeEach` (clears profile, continues resolution). Since `router.isReady()` resolves once the guard finishes regardless of outcome, the loading screen is guaranteed to hide even on an auth-check failure — no separate error/timeout path needed here.

## Testing

- Component test for `AppLoadingScreen.vue`: renders the mark, no unexpected props/slots needed.
- A light test on `App.vue` (or existing router test setup) asserting: `AppLoadingScreen` is present before `router.isReady()` resolves, and absent (with `router-view` present) after.

## Revision (2026-08-24, post-implementation)

The original "no minimum display duration" decision was reversed after the first implementation felt too brief to register on a fast local network. `useAppReady` now enforces a **1000ms minimum display time**: it starts a timer when the composable is created, and `appReady` flips to `true` only once both the router has settled (resolved or rejected) AND at least 1000ms have elapsed since start — whichever finishes last. If the router takes longer than 1000ms on its own, there is no extra wait.

## Out of Scope

- Not shown on every navigation to `/login`, only on cold start.
- No reduced-motion handling beyond what's already standard in the codebase (none identified as a pattern to follow here).
