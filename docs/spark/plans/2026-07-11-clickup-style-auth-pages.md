# ClickUp-Style Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Login and Register auth pages from a split-hero-panel layout into a ClickUp-style centered minimal layout on a full-page pastel gradient background.

**Architecture:** `AuthShell.vue` (shared by `LoginPage.vue` and `RegisterPage.vue`) is rewritten from a two-column split card into a single centered column. `Input.vue` gets one new optional slot (`trailingIcon`) for a password show/hide toggle, fully backward-compatible with every other `Input` usage in the app. No composable (`useLogin.ts`, `useRegister.ts`) or business logic changes.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Tailwind CSS + scoped component CSS, `lucide-vue-next` icons, `vue-tsc` for type-checking, `eslint --fix` for lint/format.

## Global Constraints

- This is a pure UI/layout change: do not modify `src/views/auth/composables/useLogin.ts` or `useRegister.ts`.
- This repository has no component-mounting test infrastructure (no `@vue/test-utils`, no jsdom `vitest` environment — `vitest.config.ts` uses `environment: "node"` and all existing `*.test.ts` files test pure functions only). Do not introduce one for this change. Verification for every task in this plan is: `npm run type-check`, `npx eslint --fix <files>`, and a manual browser check via the `run` skill — not a new unit-test framework.
- Drop these ClickUp reference elements entirely (no placeholders): Google-account chip, "Continue with SSO" button, "or" divider, "Forgot Password?" link, "Need help?" link. None have a backing feature in this app.
- Keep the "Ingat saya" (remember me) checkbox, positioned directly below the Password field.
- Keep the app's own brand blue (`primary` variant) on the submit button — do not recolor to ClickUp's palette. Only adopt the pill (`!rounded-full`) shape — the `!` important-modifier is required because `Button.vue`'s baked-in `rounded-md` base class otherwise wins the Tailwind cascade tie against a plain `rounded-full` passed from outside.
- `RegisterPage.vue`'s form fields (name, company, email, password, confirm password, terms checkbox) and its bottom "Sudah punya akun? Masuk di sini" link are unchanged — only the shared shell and submit-button shape change for that page.

---

### Task 1: Add an optional `trailingIcon` slot to `Input.vue`

**Files:**

- Modify: `src/components/atoms/Input.vue`

**Interfaces:**

- Consumes: nothing new (uses existing `$slots` template global already used for `$slots.icon`).
- Produces: a new named slot `trailingIcon` on `Input.vue`, usable by any future `<Input>` consumer as `<template #trailingIcon>...</template>`. When absent, rendering is byte-for-byte identical to before this task.

- [ ] **Step 1: Read the current file to confirm line numbers before editing**

Run: `sed -n '1,25p' src/components/atoms/Input.vue`

Expected output (confirms the exact block being replaced):

```
    <label class="flex flex-col gap-1.5 text-sm" :for="id">
        <span v-if="label" :class="labelClass ?? 'font-medium text-text-secondary'">
            {{ label }}
        </span>

        <div class="relative">
            <div
                v-if="$slots.icon"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            >
                <slot name="icon" />
            </div>

            <input
                :id="id"
                :value="modelValue ?? ''"
                :placeholder="placeholder"
                :type="type"
                :disabled="disabled"
                :class="[inputClasses, $slots.icon ? 'pl-10' : '']"
                v-bind="{ ...attrs, ...bindObjectId(objectId) }"
                @input="onInput"
            />
        </div>
```

- [ ] **Step 2: Replace the `<div class="relative">` block**

Replace:

```html
<div class="relative">
    <div
        v-if="$slots.icon"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
    >
        <slot name="icon" />
    </div>

    <input
        :id="id"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :type="type"
        :disabled="disabled"
        :class="[inputClasses, $slots.icon ? 'pl-10' : '']"
        v-bind="{ ...attrs, ...bindObjectId(objectId) }"
        @input="onInput"
    />
</div>
```

With:

```html
<div class="relative">
    <div
        v-if="$slots.icon"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
    >
        <slot name="icon" />
    </div>

    <input
        :id="id"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :type="type"
        :disabled="disabled"
        :class="[
                    inputClasses,
                    $slots.icon ? 'pl-10' : '',
                    $slots.trailingIcon ? 'pr-10' : '',
                ]"
        v-bind="{ ...attrs, ...bindObjectId(objectId) }"
        @input="onInput"
    />

    <div
        v-if="$slots.trailingIcon"
        class="absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-text-secondary"
    >
        <slot name="trailingIcon" />
    </div>
</div>
```

Note the leading-icon wrapper keeps `pointer-events-none` (it's decorative-only); the new trailing-icon wrapper does NOT have `pointer-events-none`, so a clickable button placed inside it (Task 3) receives clicks normally.

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no errors (exit code 0, only the `vue-tsc --noEmit` banner line printed).

- [ ] **Step 4: Lint**

Run: `npx eslint --fix src/components/atoms/Input.vue`
Expected: no output (clean).

- [ ] **Step 5: Commit**

```bash
git add src/components/atoms/Input.vue
git commit -m "feat(auth): add optional trailingIcon slot to Input atom"
```

---

### Task 2: Rewrite `AuthShell.vue` to the centered ClickUp-style layout

**Files:**

- Modify: `src/views/auth/AuthShell.vue` (full rewrite of template/script/style)
- Modify: `src/views/auth/LoginPage.vue:1-7` (remove `aside-title`/`aside-description` props only — content below unchanged until Task 3)
- Modify: `src/views/auth/RegisterPage.vue:1-6,94-103` (remove `aside-title`/`aside-description` props, add `!rounded-full` to the submit button's class)

**Interfaces:**

- Consumes: nothing new.
- Produces: `AuthShell.vue` props become `{ formTitle: string; formSubtitle?: string }` (the `asideTitle`/`asideDescription` props are removed — no other file references them after this task). A new named slot `subtitle` is available on `AuthShell`: when provided, it overrides the plain-text `formSubtitle` prop rendering inside the same `<p class="auth-card__subtitle">` wrapper. Task 3 uses this slot.

- [ ] **Step 1: Replace the entire contents of `AuthShell.vue`**

Write this full file to `src/views/auth/AuthShell.vue`:

```vue
<template>
    <div class="auth-page">
        <div class="auth-page__container">
            <img
                src="@/assets/image.png"
                alt="ALIR Smart System"
                class="auth-card__logo"
            />
            <h1 class="auth-card__title">{{ formTitle }}</h1>
            <p
                v-if="formSubtitle || $slots.subtitle"
                class="auth-card__subtitle"
            >
                <slot name="subtitle">{{ formSubtitle }}</slot>
            </p>

            <div class="auth-card__body">
                <slot />
            </div>

            <p class="auth-page__footer">
                © {{ new Date().getFullYear() }} ALIR Smart System · All rights
                reserved
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    formTitle: string;
    formSubtitle?: string;
}>();
</script>

<style scoped>
.auth-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
        135deg,
        #ffe8d6 0%,
        #fde2e4 30%,
        #e4d8f5 60%,
        #dbeafe 100%
    );
    padding: 1.5rem;
}

.auth-page__container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.auth-card__logo {
    height: 40px;
    width: auto;
    margin-bottom: 1.5rem;
}

.auth-card__title {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.3;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.auth-card__subtitle {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #64748b;
}

.auth-card__body {
    margin-top: 2rem;
    width: 100%;
}

.auth-page__footer {
    margin-top: 2rem;
    font-size: 0.6875rem;
    color: #94a3b8;
    letter-spacing: 0.02em;
}
</style>
```

This removes: the split `.auth-card` grid, the `.hero*` styles, the `.form-panel*` styles, the dot-grid/ambient-glow layers, the `features` list, the `ShieldCheck` icon usage, and the `asideTitle`/`asideDescription` props entirely.

- [ ] **Step 2: Remove the now-invalid `aside-title`/`aside-description` props from `LoginPage.vue`**

In `src/views/auth/LoginPage.vue`, replace:

```html
<AuthShell
    form-title="Masuk ke Control Room"
    form-subtitle="Gunakan akun perusahaan Anda untuk mengakses laporan dan operasi warehouse."
    aside-title="Satu portal untuk seluruh operasi gudang"
    aside-description="Monitoring stok, transaksi, dan RFID tracking dalam satu ruang kerja yang aman dan terintegrasi."
></AuthShell>
```

With:

```html
<AuthShell
    form-title="Masuk ke Control Room"
    form-subtitle="Gunakan akun perusahaan Anda untuk mengakses laporan dan operasi warehouse."
></AuthShell>
```

(The rest of `LoginPage.vue` is untouched in this task — Task 3 rewrites its form content.)

- [ ] **Step 3: Remove the now-invalid `aside-title`/`aside-description` props from `RegisterPage.vue`, and make its submit button a pill**

In `src/views/auth/RegisterPage.vue`, replace:

```html
<AuthShell
    form-title="Buat akun enterprise"
    form-subtitle="Kelola RF tags, pengguna, dan hak akses dari satu portal yang terstandardisasi."
    aside-title="Akses terkontrol untuk tim operasional"
    aside-description="Sistem terintegrasi ke IAM dan monitoring stack — cukup sambungkan API dan aturan business process Anda."
></AuthShell>
```

With:

```html
<AuthShell
    form-title="Buat akun enterprise"
    form-subtitle="Kelola RF tags, pengguna, dan hak akses dari satu portal yang terstandardisasi."
></AuthShell>
```

Then replace:

```html
<button
    type="submit"
    variant="primary"
    class="w-full justify-center"
    :disabled="submitting || !canSubmit"
    object-id="btn_RegisterSubmit"
></button>
```

With:

```html
<button
    type="submit"
    variant="primary"
    class="w-full justify-center !rounded-full"
    :disabled="submitting || !canSubmit"
    object-id="btn_RegisterSubmit"
></button>
```

Note: `!rounded-full` (not plain `rounded-full`) is required — `Button.vue`'s own `buttonClasses` computed hardcodes `rounded-md`, and since both are equal-specificity Tailwind utility classes, the tie is broken by Tailwind's compiled stylesheet order, not by class-attribute order, so a plain `rounded-full` passed from outside does not reliably win. The `!` important-modifier forces the override.

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `npx eslint --fix src/views/auth/AuthShell.vue src/views/auth/LoginPage.vue src/views/auth/RegisterPage.vue`
Expected: no output (clean).

- [ ] **Step 6: Manual verification with the dev server**

Use the `run` skill (or, if a dev server is already running for this project on a known port, reuse it) to load `/login` and `/register` in a browser and confirm:

- Both pages render a single centered column on a pastel gradient background — no split hero panel, no console errors.
- Login's form fields, "Ingat saya" checkbox, and register link (still in their pre-Task-3 positions) are all visible and functional.
- Register's submit button is now pill-shaped.

- [ ] **Step 7: Commit**

```bash
git add src/views/auth/AuthShell.vue src/views/auth/LoginPage.vue src/views/auth/RegisterPage.vue
git commit -m "feat(auth): rewrite AuthShell to centered ClickUp-style layout"
```

---

### Task 3: Rewrite `LoginPage.vue` form content

**Files:**

- Modify: `src/views/auth/LoginPage.vue` (full rewrite)

**Interfaces:**

- Consumes: `AuthShell`'s new `subtitle` slot (Task 2), `Input`'s new `trailingIcon` slot (Task 1), `useLogin()` composable's existing return shape (`form`, `touched`, `submitting`, `status`, `canSubmit`, `fieldErrors`, `handleSubmit` — unchanged, still imported from `./composables/useLogin`).
- Produces: nothing consumed by other files (this is a leaf page component).

- [ ] **Step 1: Replace the entire contents of `LoginPage.vue`**

Write this full file to `src/views/auth/LoginPage.vue`:

```vue
<template>
    <AuthShell form-title="Masuk ke Control Room">
        <template #subtitle>
            Belum punya akun?
            <RouterLink
                id="lkl_LoginRegister"
                to="/register"
                data-testid="lkl_LoginRegister"
                class="font-semibold text-primary-600 hover:text-primary-700"
                >Daftar</RouterLink
            >
        </template>

        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_LoginEmail"
                    v-model="form.email"
                    type="email"
                    label="Email perusahaan"
                    label-class="sr-only"
                    placeholder="nama@perusahaan.co.id"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_LoginEmail"
                    @blur="touched.email = true"
                />

                <Input
                    id="txt_LoginPassword"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    label="Password"
                    label-class="sr-only"
                    placeholder="Minimal 8 karakter"
                    autocomplete="current-password"
                    :error="fieldErrors.password"
                    object-id="txt_LoginPassword"
                    @blur="touched.password = true"
                >
                    <template #trailingIcon>
                        <button
                            type="button"
                            class="text-text-secondary hover:text-text"
                            :aria-label="
                                showPassword
                                    ? 'Sembunyikan password'
                                    : 'Tampilkan password'
                            "
                            @click="showPassword = !showPassword"
                        >
                            <Icon
                                :icon="showPassword ? EyeOff : Eye"
                                :size="16"
                            />
                        </button>
                    </template>
                </Input>

                <label
                    class="inline-flex items-center gap-2 text-sm text-slate-500 cursor-pointer"
                >
                    <input
                        id="chk_LoginRememberMe"
                        v-model="form.remember"
                        data-testid="chk_LoginRememberMe"
                        type="checkbox"
                        class="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Ingat saya
                </label>

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center !rounded-full"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_LoginSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{ submitting ? "Memproses..." : "Masuk" }}
                </Button>

                <p
                    v-if="status"
                    class="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-rose-500 text-center"
                >
                    {{ status }}
                </p>
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { Eye, EyeOff } from "lucide-vue-next";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { useLogin } from "./composables/useLogin";

const {
    form,
    touched,
    submitting,
    status,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useLogin();

const showPassword = ref(false);
</script>
```

Changes from the previous version: `form-subtitle` prop removed from `AuthShell` in favor of the `#subtitle` slot (with the register link now living there instead of in a row next to "Ingat saya"); both `Input`s get `label-class="sr-only"`; the password `Input` uses a dynamic `:type` bound to `showPassword` and a `#trailingIcon` eye-toggle button; the old `<div class="flex items-center justify-between text-sm">` row (remember-me + register link side by side) is replaced by the "Ingat saya" checkbox alone as its own row; the submit `Button` gains `!rounded-full` (the `!` is required — see Task 2's note on why plain `rounded-full` loses the Tailwind cascade tie against `Button.vue`'s baked-in `rounded-md`).

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npx eslint --fix src/views/auth/LoginPage.vue`
Expected: no output (clean).

- [ ] **Step 4: Manual verification with the dev server**

Reuse the dev server from Task 2 (or start one via the `run` skill) and, on `/login`:

- Confirm "Belum punya akun? Daftar" renders directly under the "Masuk ke Control Room" heading, and clicking "Daftar" navigates to `/register`.
- Confirm the Email and Password fields show placeholder text with no visible label above them.
- Click the eye icon inside the Password field: confirm the field's visible text toggles between masked and plain, and the icon swaps between `Eye`/`EyeOff`.
- Confirm "Ingat saya" checkbox is present directly below the Password field, above the "Masuk" button.
- Confirm the "Masuk" button is pill-shaped (fully rounded ends).
- Submit the form with invalid/empty fields and confirm the existing validation (`fieldErrors`) and disabled-button behavior still work exactly as before (composable untouched).

- [ ] **Step 5: Commit**

```bash
git add src/views/auth/LoginPage.vue
git commit -m "feat(auth): restyle login form to ClickUp-style layout with password toggle"
```

---

### Task 4: Final cross-page verification

**Files:** none (verification-only task).

- [ ] **Step 1: Full type-check and lint pass across all touched files**

Run:

```bash
npm run type-check
npx eslint --fix src/components/atoms/Input.vue src/views/auth/AuthShell.vue src/views/auth/LoginPage.vue src/views/auth/RegisterPage.vue
```

Expected: `type-check` prints only the `vue-tsc --noEmit` banner (no errors); `eslint --fix` prints nothing.

- [ ] **Step 2: Confirm no other file references the removed `AuthShell` props**

Run: `grep -rn "aside-title\|aside-description" src/views/auth/`
Expected: no matches (both props fully removed from every call site).

- [ ] **Step 3: Manual end-to-end browser check**

Using the `run` skill, load `/login` and `/register` and click through both flows one more time end-to-end (fields, password toggle, checkbox, cross-links, submit validation, error banner if triggerable) to confirm nothing regressed between Task 2's intermediate state and Task 3's final state.
