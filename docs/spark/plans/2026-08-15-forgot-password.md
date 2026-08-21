# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a working "Forgot password?" flow reachable from `LoginPage.vue`, backed by real backend endpoints (no email infra exists yet in `Warehouse-be`, so Supabase Auth's own recovery-email delivery is used instead of building a mailer).

**Context:** `2026-07-11-clickup-style-auth-pages.md` deliberately dropped a "Forgot Password?" link because "None have a backing feature in this app." This plan adds that backing feature, so the link can come back for real this time.

**Architecture:**

- Backend (`Warehouse-be`) proxies everything through the existing Supabase **admin** client (`SupabaseService`), matching how `login`/`register` already work — the frontend never talks to Supabase directly (no `supabase-js` on the client).
- `POST /auth/forgot-password { email }` (public) calls `adminClient.auth.resetPasswordForEmail(email, { redirectTo: <FRONTEND_URL>/reset-password })`. Always returns a generic success message regardless of whether the email exists (anti user-enumeration).
- Supabase emails the user a recovery link to `<FRONTEND_URL>/reset-password#access_token=...&type=recovery` (implicit flow — this repo has no PKCE code-verifier storage, so implicit is the only flow the frontend can complete without adding a Supabase client SDK).
- `ResetPasswordPage.vue` reads `access_token` from the URL hash and calls `POST /auth/reset-password { accessToken, password }` (public). Backend verifies the token via the existing `SupabaseService.verifyToken` (already used for every authenticated request) then calls `adminClient.auth.admin.updateUserById(userId, { password })`.
- No DB/Prisma changes — this is pure Supabase Auth state, nothing in `users` table changes.

**Operational prerequisite (cannot be verified from code):** the Supabase project's Auth settings must allow `<FRONTEND_URL>/reset-password` as a redirect URL, and the project must have email sending enabled (Supabase's default project email works out of the box for low volume; a custom SMTP provider should be configured for production volume). This plan does not touch Supabase dashboard config.

**Tech Stack:** NestJS + `@supabase/supabase-js` admin client (backend), Vue 3 `<script setup>` + existing `Input`/`Button`/`InlineAlert`/`AuthShell` components (frontend). No new dependencies.

## Global Constraints

- Every new backend response message follows the existing Indonesian-language convention seen in `auth.controller.ts` (e.g. `"Registrasi berhasil"`).
- Reuse `SupabaseService.verifyToken` for reset-token validation — do not hand-roll JWT parsing.
- Password minimum length is 10 characters, matching `RegisterDto`/`useRegister.ts`'s existing rule — do not diverge.
- No dynamic `await import(...)` for exceptions — use static imports, per the pattern already corrected in `iam.service.ts` this session.
- Follow the router's existing `isAuthRoute` pattern so an already-authenticated user hitting `/forgot-password` or `/reset-password` gets redirected to `/dashboard/overview`, same as `/login`/`/register`.

---

### Task 1 — Backend: config + Supabase service methods

**Files:**

- Modify: `src/config/app.config.ts` (add `frontendUrl`)
- Modify: `.env.example` (document `FRONTEND_URL`)
- Modify: `src/modules/external/supabase/supabase.service.ts` (add `sendPasswordResetEmail`, `updateUserPassword`)

- [x] Add `frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:5173'` to `AppConfig`/`registerAs('app', ...)`.
- [x] Add `FRONTEND_URL="http://localhost:5173"` to `.env.example` under the APPLICATION section.
- [x] Add `SupabaseService.sendPasswordResetEmail(email: string, redirectTo: string): Promise<void>` — calls `this.adminClient.auth.resetPasswordForEmail(email, { redirectTo })`; on error, only `logger.warn` (never throw — the caller must not be able to distinguish "email doesn't exist" from "email sent").
- [x] Add `SupabaseService.updateUserPassword(userId: string, password: string): Promise<void>` — calls `this.adminClient.auth.admin.updateUserById(userId, { password })`; on error, `logger.warn` and `throw new BadRequestException(...)` (static import, top of file — matches every other exception in this file except the one already fixed).

**Verification:** `npx tsc --noEmit -p .`

---

### Task 2 — Backend: DTOs, service methods, controller endpoints

**Files:**

- Add: `src/modules/auth/dto/forgot-password.dto.ts`
- Add: `src/modules/auth/dto/reset-password.dto.ts`
- Modify: `src/modules/auth/auth.service.ts` (add `forgotPassword`, `resetPassword`)
- Modify: `src/modules/auth/auth.controller.ts` (add `POST /auth/forgot-password`, `POST /auth/reset-password`, both `@Public()`)

- [x] `ForgotPasswordDto`: `email` (`@IsEmail @IsNotEmpty`).
- [x] `ResetPasswordDto`: `accessToken` (`@IsString @IsNotEmpty`), `password` (`@IsString @MinLength(10)`).
- [x] `AuthService.forgotPassword(email: string): Promise<void>` — builds `redirectTo` from `ConfigService.get<AppConfig>('app').frontendUrl + '/reset-password'`, calls `supabaseService.sendPasswordResetEmail`. Needs `ConfigService` injected into `AuthService` (not currently a constructor dependency — add it).
- [x] `AuthService.resetPassword(accessToken: string, password: string): Promise<void>` — `const user = await this.supabaseService.verifyToken(accessToken)` then `await this.supabaseService.updateUserPassword(user.id, password)`.
- [x] Controller: `POST /auth/forgot-password` `@Public()`, always responds `{ success: true, message: 'Jika email terdaftar, tautan reset password telah dikirim.', data: null }` (never leak whether the lookup found a user).
- [x] Controller: `POST /auth/reset-password` `@Public()`, responds `{ success: true, message: 'Password berhasil diperbarui.', data: null }` on success; invalid/expired token naturally surfaces as 401 via the existing `UnauthorizedException` from `verifyToken`.

**Verification:** `npx tsc --noEmit -p .`; add `auth.service.spec.ts` cases for both new methods (module currently has no auth spec file — same documented gap as `iam`) mocking `SupabaseService`.

---

### Task 3 — Frontend: API + service layer

**Files:**

- Modify: `src/api/feature/auth.api.ts` (add `forgotPassword`, `resetPassword`)
- Modify: `src/services/auth.service.ts` (add wrapper methods)

- [x] `authApi.forgotPassword(email: string)` → `POST /auth/forgot-password`.
- [x] `authApi.resetPassword(accessToken: string, password: string)` → `POST /auth/reset-password`.
- [x] `authService.forgotPassword`/`authService.resetPassword` thin wrappers, matching the existing `register` wrapper style.

**Verification:** `npx vue-tsc --noEmit`

---

### Task 4 — Frontend: ForgotPasswordPage + composable

**Files:**

- Add: `src/views/auth/ForgotPasswordPage.vue`
- Add: `src/views/auth/composables/useForgotPassword.ts`

- [x] Composable: `email` field, same email-pattern validation as `useLogin.ts`, `submitting`/`status` state, `handleSubmit` calling `authService.forgotPassword`, always shows a generic success message (via `withToast`) regardless of API response content — never surface "email not found".
- [x] Page: reuses `AuthShell`, single email `Input` (`object-id="txt_ForgotPasswordEmail"`), submit `Button` (`object-id="btn_ForgotPasswordSubmit"`), a link back to `/login` (`object-id="lkl_ForgotPasswordBackToLogin"`), Indonesian copy consistent with `LoginPage.vue`/`RegisterPage.vue`.

**Verification:** `npx vue-tsc --noEmit`; manual browser check via the `run` skill.

---

### Task 5 — Frontend: ResetPasswordPage + composable

**Files:**

- Add: `src/views/auth/ResetPasswordPage.vue`
- Add: `src/views/auth/composables/useResetPassword.ts`

- [x] Composable: reads `access_token` from `window.location.hash` on mount (parse `#access_token=...&type=recovery...`); if absent, sets an error state ("Tautan reset password tidak valid atau sudah kedaluwarsa.") and disables the form instead of crashing. Fields: `password`, `confirmPassword`, min-10-chars + match validation mirroring `useRegister.ts`. `handleSubmit` calls `authService.resetPassword(accessToken, password)`, then redirects to `/login` on success.
- [x] Page: reuses `AuthShell`, password + confirm-password `Input`s (`object-id="txt_ResetPasswordPassword"` / `txt_ResetPasswordConfirmPassword"`), submit `Button` (`object-id="btn_ResetPasswordSubmit"`).

**Verification:** `npx vue-tsc --noEmit`; manual browser check via the `run` skill (can be exercised by manually navigating to `/reset-password#access_token=<token>` with a real recovery token from a test email, or by asserting the "invalid link" error path when the hash is absent).

---

### Task 6 — Frontend: wire the link + routes

**Files:**

- Modify: `src/views/auth/LoginPage.vue` (add "Lupa password?" link)
- Modify: `src/router/index.ts` (register both routes, extend `isAuthRoute`)

- [x] Add a `RouterLink` to `/forgot-password` near the password field in `LoginPage.vue`, labelled "Lupa password?", `object-id="lkl_LoginForgotPassword"`.
- [x] Add `{ path: "/forgot-password", component: () => import("@/views/auth/ForgotPasswordPage.vue") }` and `{ path: "/reset-password", component: () => import("@/views/auth/ResetPasswordPage.vue") }` to `authRoutes`.
- [x] Extend the `isAuthRoute` check to include `to.path === "/forgot-password" || to.path === "/reset-password"` so an already-authenticated user visiting either gets redirected to `/dashboard/overview`, same as `/login`/`/register`.

**Verification:** `npx vue-tsc --noEmit`; full `npm run test:unit`; manual browser check of the whole flow via the `run` skill.

---

### Task 7 — Verification pass

- [x] Backend: `npx tsc --noEmit -p .`, `npx jest src/modules/auth`.
- [x] Frontend: `npx vue-tsc --noEmit`, `npx vitest run`.
- [x] Manual: start both servers via the `run` skill, click "Lupa password?" from `/login`, submit a real email, confirm the generic success toast appears regardless of whether the email exists.
