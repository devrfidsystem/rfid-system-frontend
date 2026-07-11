# ClickUp-style Auth Pages (Login & Register) Design

## Context

The current Login/Register pages (`AuthShell.vue`) use a split-card layout: a dark navy/teal branded "hero" panel on the left and a white form panel on the right, floating on a subtle gradient page background. The user wants the Login page restyled to match ClickUp's login page: a minimal, single centered card with no split hero panel, floating on a full-page soft pastel gradient background.

Reference: ClickUp's login page (`app.clickup.com/login`) — full-bleed pastel gradient background (peach → lavender → light blue), no card border/shadow, a narrow centered column containing: small logo mark, bold "Welcome back!" heading, a short "Don't have an account? Sign up" line, a "Continue as [google account]" chip, a "Continue with SSO" button, an "or" divider, plain-bordered Work email / Password inputs (placeholder-only, no visible label), a full-width pill-shaped "Log In" button, a "Forgot Password?" link, and a "Need help?" link at the page bottom.

Since `AuthShell.vue` is shared by both `LoginPage.vue` and `RegisterPage.vue`, and having two different auth page styles would look inconsistent when navigating between them, this redesign applies to `AuthShell.vue` itself — both Login and Register adopt the new centered-minimal layout. Register's own form fields and copy are unchanged; only the shared shell and input/button visual style change.

The app has no Google OAuth, SSO, or forgot-password/reset flow today, so those ClickUp elements (Google account chip, "Continue with SSO", "Forgot Password?", "Need help?") are dropped entirely rather than added as non-functional placeholders — consistent with not shipping dead-end UI.

## Scope

**In scope:** `src/views/auth/AuthShell.vue` (full rewrite of layout/styles), `src/views/auth/LoginPage.vue` (form restructure), `src/views/auth/RegisterPage.vue` (prop usage + restyle only, fields unchanged), `src/components/atoms/Input.vue` (additive `#trailingIcon` slot).

**Out of scope:** `useLogin.ts` / `useRegister.ts` composable logic (no changes), Google/SSO/forgot-password integration (not built, not stubbed), any other page's use of `Input.vue` (the new slot is opt-in and unused elsewhere).

## `AuthShell.vue` — new layout

Replace the two-column split-card (`.auth-card` grid with `.hero` + `.form-panel`) with a single full-viewport container:

- Background: full-page soft pastel gradient (diagonal, peach → lavender → light blue), replacing the current `linear-gradient(160deg, #f0f4ff 0%, #f8fafc 40%, #f0fdfa 100%)` with a warmer multi-stop pastel gradient closer to the reference. Remove the dot-grid and ambient-glow decorative layers — the reference is a flat, texture-free gradient.
- No card border, no box-shadow, no grid split. A single centered column, `max-width: 440px`, vertically and horizontally centered in the viewport (flex, `min-height: 100vh`).
- Contents, top to bottom, centered text-align:
  1. Logo mark (`@/assets/image.png`), natural colors (no `invert(1)` filter), small (`h-10`–`h-12`), centered.
  2. Bold heading (`formTitle` prop), large, dark, centered — replaces `.hero__title`'s role.
  3. Short subtitle line (`formSubtitle` prop) — for Login this becomes a short "Belum punya akun? **Daftar**" style line (see below); for Register it stays the existing short descriptive sentence.
  4. `<slot />` — the form content, unchanged mounting point.
- Footer copyright line stays as-is, small and centered below the column.
- Remove `asideTitle`/`asideDescription` props, the `features` list, `hero__badge`, and all `.hero*`/`.form-panel*` styles — they no longer apply. Remove the now-unused `ShieldCheck` import.

## `LoginPage.vue` — form changes

- Drop the current subtitle prop value (long descriptive sentence) passed to `AuthShell`; pass a short subtitle instead, rendered as "Belum punya akun? **Daftar**" (the "Daftar" segment is a `RouterLink` to `/register`) — this replaces the previous bottom-of-row register link entirely (no duplicate link elsewhere in the form).
- Email input: `label-class="sr-only"` (label stays for screen readers, hidden visually; placeholder becomes the visible cue), same `Input` component and validation as today.
- Password input: same `sr-only` label treatment, plus a new `#trailingIcon` slot usage — an eye/eye-off icon button that toggles the input's `type` between `password` and `text` (local component state, no composable change).
- "Ingat saya" checkbox: stays, moved to sit directly below the Password field (its own row), above the submit button — no longer sharing a row with the register link (that link moved up near the heading per above).
- Submit button: `variant="primary"`, `class="w-full justify-center rounded-full"` (pill shape via an added `rounded-full` override on top of the existing primary blue color) — keep the app's brand blue, not ClickUp's palette; disabled state already handled by the existing `Button` disabled styling.
- Status/error banner: unchanged.
- Drop entirely: Google account chip, "Continue with SSO" button, "or" divider, "Forgot Password?" link, "Need help?" link — none of these have a backing feature.

## `RegisterPage.vue` — changes

- Remove the `aside-title` / `aside-description` props passed to `AuthShell` (no longer accepted).
- No field/content changes: name, company, email, password, confirm password, terms checkbox, submit button, and the existing "Sudah punya akun? Masuk di sini" link at the bottom of the form all stay exactly as they are today, just rendered inside the new centered shell instead of the split-card right panel.
- Submit button gets the same `rounded-full` pill treatment as Login's, for visual consistency.

## `Input.vue` — additive change only

- Add an optional `#trailingIcon` slot, mirroring the existing `#icon` (leading) slot but anchored `right-3` instead of `left-3`, and NOT `pointer-events-none` (so it can host a clickable toggle button, unlike the leading icon which is decorative-only). When absent, rendering is identical to today — zero impact on every other `Input` usage across the app.

## Verification

- `npm run type-check` and `npx eslint --fix` on the four touched files.
- Use the `run` skill to load `/login` and `/register` in a browser: confirm centered minimal layout renders correctly at desktop and mobile widths, email/password fields work, the password eye-toggle switches visibility, "Ingat saya" still submits correctly, "Daftar"/"Masuk di sini" cross-links navigate correctly, and the existing submit/validation/error-banner behavior is unchanged (same composables, no logic touched).
