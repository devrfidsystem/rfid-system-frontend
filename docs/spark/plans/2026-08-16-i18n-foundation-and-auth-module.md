# i18n Foundation + Auth Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Indonesian/English i18n support to the app via `vue-i18n`, and fully migrate the Auth module (Login, Register, Forgot Password, Reset Password, AuthShell) plus a language switcher on the Profile page, as the reference pattern for all remaining modules.

**Architecture:** `vue-i18n` (Composition API, global scope) provides `t()` everywhere. Locale messages live in `src/locales/<locale>/<namespace>.json`, merged in `src/locales/index.ts` into one `createI18n()` instance installed as a Vue plugin in `main.ts`. A Pinia `locale.store.ts` (mirroring the existing `theme.store.ts` pattern) persists the chosen locale to `localStorage` and drives `i18n.global.locale`. Config/DTO layers store i18n keys, not literal text; resolution to display text always happens at the render site via `t()`.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), `vue-i18n@^11.4.8`, Pinia, Vitest (node environment, no jsdom — component/text-regression checks use `?raw` source-string assertions, following the existing convention in `src/views/auth/loginFormUsage.test.ts` and `src/config/projectTooling.test.ts`).

## Global Constraints

- Default locale is Indonesian (`id`); no browser-locale auto-detection (per approved design spec `docs/spark/specs/2026-08-16-i18n-id-en-design.md`).
- Language switcher lives only on the Profile page — no topbar quick-switcher.
- Only frontend-owned text is translated (static UI copy, frontend-mapped labels, validation messages). Backend-originated content (server error bodies, entity data values) is out of scope.
- Config/DTO objects must store i18n **keys**, never literal strings; templates/composables resolve text via `t()`.
- Every `id/<namespace>.json` file must have an exact key-parity match in the corresponding `en/<namespace>.json` file (enforced by an automated guard test).
- This plan covers only the Auth module + foundation. Dashboard, IAM, Master Data, Transactions, Stock Opname, Stock, RFID/Log, Reports, Settings, and shared atoms/molecules/organisms are each migrated in their own follow-up plan using the same pattern established here.

---

### Task 1: Add the `vue-i18n` dependency

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `vue-i18n` package available for import (`createI18n`, `useI18n`) in all later tasks.

- [ ] **Step 1: Install the package**

Run: `npm install vue-i18n@^11.4.8`

Expected: `package.json` `dependencies` now includes `"vue-i18n": "^11.4.8"` (or the resolved version npm installs), and `package-lock.json` is updated.

- [ ] **Step 2: Verify it resolves**

Run: `node -e "require.resolve('vue-i18n')"`

Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vue-i18n dependency"
```

---

### Task 2: Create the `common` locale namespace (id/en)

**Files:**
- Create: `src/locales/id/common.json`
- Create: `src/locales/en/common.json`
- Test: `src/locales/common.test.ts`

**Interfaces:**
- Produces: `common.password.show`, `common.password.hide`, `common.language.label`, `common.language.indonesian`, `common.language.english` keys, consumed by Task 9 (Login password toggle) and Task 13 (Profile language switcher).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, test } from "vitest";
import commonId from "./id/common.json";
import commonEn from "./en/common.json";

describe("common locale namespace", () => {
    test("id namespace defines password and language copy", () => {
        expect(commonId.password.show).toBe("Tampilkan password");
        expect(commonId.password.hide).toBe("Sembunyikan password");
        expect(commonId.language.label).toBe("Bahasa");
        expect(commonId.language.indonesian).toBe("Indonesia");
        expect(commonId.language.english).toBe("Inggris");
    });

    test("en namespace defines password and language copy", () => {
        expect(commonEn.password.show).toBe("Show password");
        expect(commonEn.password.hide).toBe("Hide password");
        expect(commonEn.language.label).toBe("Language");
        expect(commonEn.language.indonesian).toBe("Indonesian");
        expect(commonEn.language.english).toBe("English");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/locales/common.test.ts`
Expected: FAIL — `Cannot find module './id/common.json'`

- [ ] **Step 3: Create the locale files**

`src/locales/id/common.json`:

```json
{
    "password": {
        "show": "Tampilkan password",
        "hide": "Sembunyikan password"
    },
    "language": {
        "label": "Bahasa",
        "indonesian": "Indonesia",
        "english": "Inggris"
    }
}
```

`src/locales/en/common.json`:

```json
{
    "password": {
        "show": "Show password",
        "hide": "Hide password"
    },
    "language": {
        "label": "Language",
        "indonesian": "Indonesian",
        "english": "English"
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/locales/common.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/locales/id/common.json src/locales/en/common.json src/locales/common.test.ts
git commit -m "feat: add common locale namespace (id/en)"
```

---

### Task 3: Create the `auth` locale namespace (id/en)

**Files:**
- Create: `src/locales/id/auth.json`
- Create: `src/locales/en/auth.json`
- Test: `src/locales/auth.test.ts`

**Interfaces:**
- Produces: all `auth.shell.*`, `auth.login.*`, `auth.register.*`, `auth.forgotPassword.*`, `auth.resetPassword.*` keys consumed by Tasks 8–12.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, test } from "vitest";
import authId from "./id/auth.json";
import authEn from "./en/auth.json";

describe("auth locale namespace", () => {
    test("id namespace defines login copy", () => {
        expect(authId.login.submit).toBe("Masuk");
        expect(authId.login.errors.emailInvalid).toBe(
            "Gunakan email valid perusahaan.",
        );
    });

    test("en namespace defines login copy", () => {
        expect(authEn.login.submit).toBe("Sign in");
        expect(authEn.login.errors.emailInvalid).toBe(
            "Use a valid company email.",
        );
    });

    test("id and en namespaces expose the same top-level sections", () => {
        expect(Object.keys(authEn).sort()).toEqual(Object.keys(authId).sort());
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/locales/auth.test.ts`
Expected: FAIL — `Cannot find module './id/auth.json'`

- [ ] **Step 3: Create the locale files**

`src/locales/id/auth.json`:

```json
{
    "shell": {
        "footer": "© {year} ALIR Smart System · Seluruh hak cipta dilindungi"
    },
    "login": {
        "subtitlePrompt": "Belum punya akun?",
        "subtitleLink": "Daftar",
        "emailLabel": "Email perusahaan",
        "emailPlaceholder": "nama@perusahaan.co.id",
        "passwordLabel": "Password",
        "passwordPlaceholder": "Minimal 8 karakter",
        "rememberMe": "Ingat saya",
        "forgotPassword": "Lupa password?",
        "submit": "Masuk",
        "submitting": "Memproses...",
        "errors": {
            "emailInvalid": "Gunakan email valid perusahaan.",
            "passwordInvalid": "Password harus terdiri dari minimal 8 karakter.",
            "incomplete": "Lengkapi kolom sebelum melanjutkan.",
            "genericFailure": "Gagal masuk. Silakan coba lagi."
        },
        "toastSuccess": "Selamat datang kembali!",
        "toastError": "Login gagal. Silakan periksa kredensial Anda."
    },
    "register": {
        "title": "Buat akun enterprise",
        "subtitle": "Kelola RF tags, pengguna, dan hak akses dari satu portal yang terstandardisasi.",
        "fullNameLabel": "Nama lengkap",
        "fullNamePlaceholder": "Nama sesuai KTP atau pass",
        "companyLabel": "Perusahaan / unit",
        "companyPlaceholder": "Contoh: PT. Logistik Nusantara",
        "emailLabel": "Email kerja",
        "emailPlaceholder": "nama@perusahaan.co.id",
        "passwordLabel": "Password",
        "passwordPlaceholder": "Minimal 10 karakter",
        "confirmPasswordLabel": "Konfirmasi password",
        "confirmPasswordPlaceholder": "Ketik ulang password",
        "termsLabel": "Saya sudah membaca kebijakan keamanan dan siap mengikuti role-based approval sebelum akses diberikan.",
        "submit": "Daftar",
        "submitting": "Mengecek...",
        "alreadyHaveAccount": "Sudah punya akun?",
        "loginLink": "Masuk di sini",
        "errors": {
            "fullNameRequired": "Nama tidak boleh kosong.",
            "companyRequired": "Isi nama unit atau perusahaan.",
            "emailInvalid": "Pastikan email valid perusahaan.",
            "passwordInvalid": "Password minimal 10 karakter.",
            "confirmPasswordMismatch": "Password harus cocok.",
            "termsRequired": "Centang untuk melanjutkan.",
            "incomplete": "Periksa kembali data registrasi Anda."
        },
        "toastSuccess": "Registrasi berhasil! Silakan masuk dengan akun Anda.",
        "toastError": "Gagal mendaftar. Silakan coba lagi nanti.",
        "fallbackError": "Gagal mendaftar."
    },
    "forgotPassword": {
        "title": "Lupa password?",
        "subtitle": "Masukkan email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang password.",
        "emailLabel": "Email",
        "emailPlaceholder": "nama@perusahaan.co.id",
        "submit": "Kirim tautan reset",
        "submitting": "Mengirim...",
        "bannerSuccess": "Jika email terdaftar, tautan reset password telah dikirim. Silakan periksa kotak masuk Anda.",
        "rememberPrompt": "Sudah ingat password?",
        "backToLogin": "Kembali ke halaman masuk",
        "errors": {
            "emailInvalid": "Gunakan email valid perusahaan.",
            "emailRequired": "Masukkan email yang valid."
        },
        "toastSuccess": "Jika email terdaftar, tautan reset password telah dikirim.",
        "toastError": "Gagal mengirim tautan reset password.",
        "unexpectedError": "Terjadi kesalahan. Silakan coba lagi beberapa saat."
    },
    "resetPassword": {
        "title": "Atur ulang password",
        "subtitle": "Buat password baru untuk akun Anda.",
        "passwordLabel": "Password baru",
        "passwordPlaceholder": "Minimal 10 karakter",
        "confirmPasswordLabel": "Konfirmasi password baru",
        "confirmPasswordPlaceholder": "Ketik ulang password baru",
        "submit": "Simpan password baru",
        "submitting": "Menyimpan...",
        "errors": {
            "passwordInvalid": "Password minimal 10 karakter.",
            "confirmPasswordMismatch": "Password harus cocok.",
            "incomplete": "Lengkapi kolom sebelum melanjutkan.",
            "invalidLink": "Tautan reset password tidak valid atau sudah kedaluwarsa."
        },
        "toastSuccess": "Password berhasil diperbarui.",
        "toastError": "Gagal memperbarui password"
    }
}
```

`src/locales/en/auth.json`:

```json
{
    "shell": {
        "footer": "© {year} ALIR Smart System · All rights reserved"
    },
    "login": {
        "subtitlePrompt": "Don't have an account?",
        "subtitleLink": "Sign up",
        "emailLabel": "Company email",
        "emailPlaceholder": "name@company.co.id",
        "passwordLabel": "Password",
        "passwordPlaceholder": "At least 8 characters",
        "rememberMe": "Remember me",
        "forgotPassword": "Forgot password?",
        "submit": "Sign in",
        "submitting": "Signing in...",
        "errors": {
            "emailInvalid": "Use a valid company email.",
            "passwordInvalid": "Password must be at least 8 characters.",
            "incomplete": "Complete the fields before continuing.",
            "genericFailure": "Sign-in failed. Please try again."
        },
        "toastSuccess": "Welcome back!",
        "toastError": "Sign-in failed. Please check your credentials."
    },
    "register": {
        "title": "Create an enterprise account",
        "subtitle": "Manage RF tags, users, and access from one standardized portal.",
        "fullNameLabel": "Full name",
        "fullNamePlaceholder": "Name as shown on ID or passport",
        "companyLabel": "Company / unit",
        "companyPlaceholder": "e.g. PT. Logistik Nusantara",
        "emailLabel": "Work email",
        "emailPlaceholder": "name@company.co.id",
        "passwordLabel": "Password",
        "passwordPlaceholder": "At least 10 characters",
        "confirmPasswordLabel": "Confirm password",
        "confirmPasswordPlaceholder": "Re-type your password",
        "termsLabel": "I have read the security policy and am ready to follow role-based approval before access is granted.",
        "submit": "Sign up",
        "submitting": "Checking...",
        "alreadyHaveAccount": "Already have an account?",
        "loginLink": "Sign in here",
        "errors": {
            "fullNameRequired": "Full name is required.",
            "companyRequired": "Enter your company or unit name.",
            "emailInvalid": "Make sure the company email is valid.",
            "passwordInvalid": "Password must be at least 10 characters.",
            "confirmPasswordMismatch": "Passwords must match.",
            "termsRequired": "Check this box to continue.",
            "incomplete": "Review your registration details."
        },
        "toastSuccess": "Registration successful! Please sign in with your account.",
        "toastError": "Failed to register. Please try again later.",
        "fallbackError": "Failed to register."
    },
    "forgotPassword": {
        "title": "Forgot password?",
        "subtitle": "Enter your account email. We'll send you a link to reset your password.",
        "emailLabel": "Email",
        "emailPlaceholder": "name@company.co.id",
        "submit": "Send reset link",
        "submitting": "Sending...",
        "bannerSuccess": "If the email is registered, a password reset link has been sent. Please check your inbox.",
        "rememberPrompt": "Remember your password?",
        "backToLogin": "Back to sign in",
        "errors": {
            "emailInvalid": "Use a valid company email.",
            "emailRequired": "Enter a valid email."
        },
        "toastSuccess": "If the email is registered, a password reset link has been sent.",
        "toastError": "Failed to send the password reset link.",
        "unexpectedError": "Something went wrong. Please try again shortly."
    },
    "resetPassword": {
        "title": "Reset password",
        "subtitle": "Create a new password for your account.",
        "passwordLabel": "New password",
        "passwordPlaceholder": "At least 10 characters",
        "confirmPasswordLabel": "Confirm new password",
        "confirmPasswordPlaceholder": "Re-type your new password",
        "submit": "Save new password",
        "submitting": "Saving...",
        "errors": {
            "passwordInvalid": "Password must be at least 10 characters.",
            "confirmPasswordMismatch": "Passwords must match.",
            "incomplete": "Complete the fields before continuing.",
            "invalidLink": "The password reset link is invalid or has expired."
        },
        "toastSuccess": "Password updated successfully.",
        "toastError": "Failed to update password"
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/locales/auth.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/locales/id/auth.json src/locales/en/auth.json src/locales/auth.test.ts
git commit -m "feat: add auth locale namespace (id/en)"
```

---

### Task 4: Create the `vue-i18n` instance

**Files:**
- Create: `src/locales/index.ts`
- Test: `src/locales/index.test.ts`

**Interfaces:**
- Consumes: `src/locales/id/common.json`, `src/locales/en/common.json`, `src/locales/id/auth.json`, `src/locales/en/auth.json` (Tasks 2–3).
- Produces: `export const i18n` — a `createI18n()` instance with `i18n.global.locale` (`WritableComputedRef<string>`) and `i18n.global.t(key, params?)`, consumed by Task 5 (`main.ts`), Task 6 (`locale.store.ts`), and every migrated component.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, test } from "vitest";
import { i18n } from "./index";

describe("i18n instance", () => {
    test("defaults to Indonesian locale", () => {
        expect(i18n.global.locale.value).toBe("id");
    });

    test("resolves a nested auth key in the default locale", () => {
        expect(i18n.global.t("auth.login.submit")).toBe("Masuk");
    });

    test("resolves the same key in English after switching locale", () => {
        i18n.global.locale.value = "en";
        expect(i18n.global.t("auth.login.submit")).toBe("Sign in");
        i18n.global.locale.value = "id";
    });

    test("resolves a common namespace key", () => {
        expect(i18n.global.t("common.language.label")).toBe("Bahasa");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/locales/index.test.ts`
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 3: Create the i18n instance**

```typescript
import { createI18n } from "vue-i18n";
import commonId from "./id/common.json";
import commonEn from "./en/common.json";
import authId from "./id/auth.json";
import authEn from "./en/auth.json";

export type AppLocale = "id" | "en";

const messages = {
    id: {
        common: commonId,
        auth: authId,
    },
    en: {
        common: commonEn,
        auth: authEn,
    },
};

export const i18n = createI18n({
    legacy: false,
    locale: "id" satisfies AppLocale,
    fallbackLocale: "id" satisfies AppLocale,
    messages,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/locales/index.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/locales/index.ts src/locales/index.test.ts
git commit -m "feat: create vue-i18n instance"
```

---

### Task 5: Install the i18n plugin in `main.ts`

**Files:**
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `i18n` from `src/locales/index.ts` (Task 4).

- [ ] **Step 1: Update `main.ts`**

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { i18n } from "@/locales";
import { useAuthStore } from "@/store/auth.store";
import "./assets/styles/app.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

const authStore = useAuthStore(pinia);

const bootstrapAuth = async () => {
    try {
        // Initialize auth store (supabase client will lazily initialize when needed)
        await authStore.initializeAuth();
    } catch {
        authStore.clearProfile();
    }
};

void bootstrapAuth();

app.mount("#app");
```

(The locale store's `initialize()` call is added in Task 6, once the store exists.)

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: install vue-i18n plugin in app bootstrap"
```

---

### Task 6: Create the locale store

**Files:**
- Create: `src/store/locale.store.ts`
- Test: `src/store/locale.store.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `i18n` and the `AppLocale` type, both from `src/locales/index.ts` (Task 4).
- Produces: `useLocaleStore()` with `state.locale: AppLocale`, `initialize(): void`, `setLocale(locale: AppLocale): void` — consumed by Task 13 (Profile language switcher) and `main.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useLocaleStore } from "./locale.store";
import { i18n } from "@/locales";

describe("useLocaleStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        window.localStorage.clear();
        i18n.global.locale.value = "id";
    });

    it("defaults to Indonesian when nothing is stored", () => {
        const store = useLocaleStore();
        store.initialize();

        expect(store.locale).toBe("id");
        expect(i18n.global.locale.value).toBe("id");
    });

    it("restores a previously stored locale", () => {
        window.localStorage.setItem("rfid-locale", "en");
        const store = useLocaleStore();
        store.initialize();

        expect(store.locale).toBe("en");
        expect(i18n.global.locale.value).toBe("en");
    });

    it("updates the store, i18n instance, and localStorage on setLocale", () => {
        const store = useLocaleStore();
        store.initialize();

        store.setLocale("en");

        expect(store.locale).toBe("en");
        expect(i18n.global.locale.value).toBe("en");
        expect(window.localStorage.getItem("rfid-locale")).toBe("en");
    });

    it("ignores an invalid stored value and falls back to Indonesian", () => {
        window.localStorage.setItem("rfid-locale", "fr");
        const store = useLocaleStore();
        store.initialize();

        expect(store.locale).toBe("id");
    });
});
```

Note: this test relies on a `window`/`localStorage` global. Since `vitest.config.ts` runs the `node` environment, this test file needs `jsdom`-like `window`; instead, `locale.store.ts` follows the same `typeof window === "undefined"` guard as `theme.store.ts` and this test injects a minimal `window.localStorage` stub if `window` is undefined — see Step 3's guard code. In the `node` test environment, `window` is `undefined`, so add this setup at the top of the test file:

```typescript
if (typeof window === "undefined") {
    (globalThis as { window?: unknown }).window = {
        localStorage: (() => {
            const store = new Map<string, string>();
            return {
                getItem: (key: string) => store.get(key) ?? null,
                setItem: (key: string, value: string) => {
                    store.set(key, value);
                },
                clear: () => store.clear(),
            };
        })(),
    };
}
```

Place this block above the `describe` call in `src/store/locale.store.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/locale.store.test.ts`
Expected: FAIL — `Cannot find module './locale.store'`

- [ ] **Step 3: Create the locale store**

```typescript
import { defineStore } from "pinia";
import { i18n, type AppLocale } from "@/locales";

const STORAGE_KEY = "rfid-locale";
const SUPPORTED_LOCALES: AppLocale[] = ["id", "en"];

const isAppLocale = (value: string | null): value is AppLocale =>
    value !== null &&
    (SUPPORTED_LOCALES as string[]).includes(value);

const getStoredLocale = (): AppLocale => {
    if (typeof window === "undefined") return "id";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isAppLocale(stored) ? stored : "id";
};

export const useLocaleStore = defineStore("locale", {
    state: () => ({
        locale: "id" as AppLocale,
        initialized: false,
    }),
    actions: {
        initialize() {
            if (this.initialized) return;
            this.locale = getStoredLocale();
            i18n.global.locale.value = this.locale;
            this.initialized = true;
        },
        setLocale(locale: AppLocale) {
            this.locale = locale;
            i18n.global.locale.value = locale;
            if (typeof window !== "undefined") {
                window.localStorage.setItem(STORAGE_KEY, locale);
            }
        },
    },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/locale.store.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Wire `initialize()` into `main.ts`**

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { i18n } from "@/locales";
import { useAuthStore } from "@/store/auth.store";
import { useLocaleStore } from "@/store/locale.store";
import "./assets/styles/app.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

const authStore = useAuthStore(pinia);
const localeStore = useLocaleStore(pinia);
localeStore.initialize();

const bootstrapAuth = async () => {
    try {
        // Initialize auth store (supabase client will lazily initialize when needed)
        await authStore.initializeAuth();
    } catch {
        authStore.clearProfile();
    }
};

void bootstrapAuth();

app.mount("#app");
```

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/store/locale.store.ts src/store/locale.store.test.ts src/main.ts
git commit -m "feat: add locale store and wire it into app bootstrap"
```

---

### Task 7: Add the i18n key-parity guard test

**Files:**
- Create: `src/config/i18nKeyParity.test.ts`

**Interfaces:**
- Consumes: every `src/locales/id/*.json` / `src/locales/en/*.json` file pair (Tasks 2–3, and every namespace added by future module plans).

- [ ] **Step 1: Write the test (this test starts passing immediately — it's a guard against future regressions, not new production code)**

```typescript
import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const localesRoot = resolve(process.cwd(), "src/locales");

const flattenKeys = (value: unknown, prefix = ""): string[] => {
    if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return [prefix];
    }
    return Object.entries(value as Record<string, unknown>).flatMap(
        ([key, nested]) =>
            flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
    );
};

const readNamespaceKeys = (locale: string, fileName: string): string[] => {
    const filePath = resolve(localesRoot, locale, fileName);
    const content = JSON.parse(readFileSync(filePath, "utf8"));
    return flattenKeys(content).sort();
};

describe("i18n key parity", () => {
    const namespaceFiles = readdirSync(resolve(localesRoot, "id")).filter(
        (fileName) => fileName.endsWith(".json"),
    );

    test("at least one locale namespace exists", () => {
        expect(namespaceFiles.length).toBeGreaterThan(0);
    });

    test.each(namespaceFiles)(
        "%s has matching keys in id and en",
        (fileName) => {
            const idKeys = readNamespaceKeys("id", fileName);
            const enKeys = readNamespaceKeys("en", fileName);

            expect(enKeys).toEqual(idKeys);
        },
    );
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/config/i18nKeyParity.test.ts`
Expected: PASS (3 tests: 1 base test + `common.json` + `auth.json`)

- [ ] **Step 3: Commit**

```bash
git add src/config/i18nKeyParity.test.ts
git commit -m "test: guard id/en locale namespaces against key drift"
```

---

### Task 8: Migrate `AuthShell.vue`

**Files:**
- Modify: `src/views/auth/AuthShell.vue`
- Test: `src/views/auth/authShellI18n.test.ts`

**Interfaces:**
- Consumes: `auth.shell.footer` key (Task 3).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import authShellSource from "./AuthShell.vue?raw";

describe("AuthShell i18n usage", () => {
    it("resolves the footer copyright text through vue-i18n", () => {
        expect(authShellSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(authShellSource).toContain("auth.shell.footer");
        expect(authShellSource).not.toContain("All rights reserved");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/auth/authShellI18n.test.ts`
Expected: FAIL — `useI18n` import not found in source.

- [ ] **Step 3: Migrate the template and script**

Replace the `<footer>` block:

```vue
        <footer class="auth-page__footer">
            {{ t("auth.shell.footer", { year: new Date().getFullYear() }) }}
        </footer>
```

Update the script block:

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
    formTitle?: string;
    formSubtitle?: string;
}>();

const { t } = useI18n();
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/auth/authShellI18n.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/auth/AuthShell.vue src/views/auth/authShellI18n.test.ts
git commit -m "feat: translate AuthShell footer via vue-i18n"
```

---

### Task 9: Migrate `LoginPage.vue` + `useLogin.ts`

**Files:**
- Modify: `src/views/auth/LoginPage.vue`
- Modify: `src/views/auth/composables/useLogin.ts`
- Modify: `src/views/auth/loginFormUsage.test.ts` (extend, do not remove existing assertions)

**Interfaces:**
- Consumes: `auth.login.*`, `common.password.show`, `common.password.hide` keys (Tasks 2–3).

- [ ] **Step 1: Write the failing test (append to existing file)**

Add this new `describe` block to `src/views/auth/loginFormUsage.test.ts` (keep the existing `describe("auth form primitives", ...)` block untouched):

```typescript
describe("LoginPage i18n usage", () => {
    it("resolves login copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(loginSource).toContain('import { useI18n } from "vue-i18n"');
        expect(loginSource).toContain("auth.login.submit");
        expect(loginSource).toContain("auth.login.emailLabel");
        expect(loginSource).toContain("common.password.show");
        expect(loginSource).not.toContain("Belum punya akun?");
        expect(loginSource).not.toContain('"Masuk"');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/auth/loginFormUsage.test.ts`
Expected: FAIL — new assertions fail (source still hardcoded).

- [ ] **Step 3: Migrate `useLogin.ts`**

```typescript
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { sessionService } from "@/services/session.service";
import { useAuthStore } from "@/store/auth.store";
import { useNotifier } from "@/composable/useNotifier";

export function useLogin() {
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();
    const { withToast } = useNotifier();
    const { t } = useI18n();

    const form = reactive({
        email: "",
        password: "",
        remember: true,
    });

    const touched = reactive({
        email: false,
        password: false,
    });

    const submitting = ref(false);
    const status = ref<string | null>(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isEmailValid = computed(() => emailPattern.test(form.email));
    const isPasswordValid = computed(() => form.password.length >= 8);
    const canSubmit = computed(
        () => isEmailValid.value && isPasswordValid.value,
    );

    const fieldErrors = computed(() => ({
        email:
            touched.email && !isEmailValid.value
                ? t("auth.login.errors.emailInvalid")
                : undefined,
        password:
            touched.password && !isPasswordValid.value
                ? t("auth.login.errors.passwordInvalid")
                : undefined,
    }));

    const toErrorMessage = (error: unknown) => {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        return t("auth.login.errors.genericFailure");
    };

    const handleSubmit = async () => {
        touched.email = true;
        touched.password = true;

        if (!canSubmit.value) {
            status.value = t("auth.login.errors.incomplete");
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    const session = await sessionService.signInWithPassword({
                        email: form.email.trim(),
                        password: form.password,
                    });

                    authStore.setSession(session.accessToken);
                    authStore.setProfile(session.profile);
                },
                {
                    loadingRef: submitting,
                    successMessage: t("auth.login.toastSuccess"),
                    errorMessage: t("auth.login.toastError"),
                },
            );

            const redirectTarget =
                (route.query.redirect as string | undefined) ?? "/dashboard";
            await router.replace(redirectTarget);
        } catch (error) {
            status.value = toErrorMessage(error);
        }
    };

    return {
        form,
        touched,
        submitting,
        status,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
```

- [ ] **Step 4: Migrate `LoginPage.vue`**

```vue
<template>
    <AuthShell>
        <template #subtitle>
            {{ t("auth.login.subtitlePrompt") }}
            <RouterLink
                id="lkl_LoginRegister"
                to="/register"
                data-testid="lkl_LoginRegister"
                class="font-semibold text-primary-600 hover:text-primary-700"
                >{{ t("auth.login.subtitleLink") }}</RouterLink
            >
        </template>

        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_LoginEmail"
                    v-model="form.email"
                    type="email"
                    :label="t('auth.login.emailLabel')"
                    label-class="sr-only"
                    :placeholder="t('auth.login.emailPlaceholder')"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_LoginEmail"
                    @blur="touched.email = true"
                />

                <Input
                    id="txt_LoginPassword"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    :label="t('auth.login.passwordLabel')"
                    label-class="sr-only"
                    :placeholder="t('auth.login.passwordPlaceholder')"
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
                                    ? t('common.password.hide')
                                    : t('common.password.show')
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

                <div class="flex items-center justify-between">
                    <CheckboxField
                        v-model="form.remember"
                        :label="t('auth.login.rememberMe')"
                        object-id="chk_LoginRememberMe"
                    />
                    <RouterLink
                        id="lkl_LoginForgotPassword"
                        to="/forgot-password"
                        data-testid="lkl_LoginForgotPassword"
                        class="text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >{{ t("auth.login.forgotPassword") }}</RouterLink
                    >
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_LoginSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{
                        submitting
                            ? t("auth.login.submitting")
                            : t("auth.login.submit")
                    }}
                </Button>

                <InlineAlert
                    v-if="status"
                    variant="error"
                    :description="status"
                    compact
                    class="text-xs"
                />
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { Eye, EyeOff } from "lucide-vue-next";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import CheckboxField from "@/components/ui/form/CheckboxField.vue";
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
const { t } = useI18n();
</script>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/views/auth/loginFormUsage.test.ts`
Expected: PASS (all tests in the file, including the pre-existing `describe("auth form primitives", ...)` block)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/auth/LoginPage.vue src/views/auth/composables/useLogin.ts src/views/auth/loginFormUsage.test.ts
git commit -m "feat: translate LoginPage and useLogin via vue-i18n"
```

---

### Task 10: Migrate `RegisterPage.vue` + `useRegister.ts`

**Files:**
- Modify: `src/views/auth/RegisterPage.vue`
- Modify: `src/views/auth/composables/useRegister.ts`
- Modify: `src/views/auth/loginFormUsage.test.ts` (extend)

**Interfaces:**
- Consumes: `auth.register.*` keys (Task 3).

- [ ] **Step 1: Write the failing test (append to `loginFormUsage.test.ts`)**

```typescript
describe("RegisterPage i18n usage", () => {
    it("resolves register copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(registerSource).toContain('import { useI18n } from "vue-i18n"');
        expect(registerSource).toContain("auth.register.submit");
        expect(registerSource).toContain("auth.register.emailLabel");
        expect(registerSource).not.toContain("Buat akun enterprise");
        expect(registerSource).not.toContain('"Daftar"');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/auth/loginFormUsage.test.ts`
Expected: FAIL — new assertions fail.

- [ ] **Step 3: Migrate `useRegister.ts`**

```typescript
import { reactive, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useNotifier } from "@/composable/useNotifier";
import { authService } from "@/services/auth.service";

export function useRegister() {
    const router = useRouter();
    const { withToast } = useNotifier();
    const { t } = useI18n();

    const form = reactive({
        fullName: "",
        company: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
    });

    type TouchState = {
        fullName: boolean;
        company: boolean;
        email: boolean;
        password: boolean;
        confirmPassword: boolean;
        terms: boolean;
    };

    const touched = reactive<TouchState>({
        fullName: false,
        company: false,
        email: false,
        password: false,
        confirmPassword: false,
        terms: false,
    });

    const submitting = ref(false);
    const status = ref<string | null>(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = computed(() => emailPattern.test(form.email));
    const isPasswordValid = computed(() => form.password.length >= 10);
    const passwordsMatch = computed(
        () => form.password && form.password === form.confirmPassword,
    );
    const canSubmit = computed(
        () =>
            form.fullName &&
            form.company &&
            isEmailValid.value &&
            isPasswordValid.value &&
            passwordsMatch.value &&
            form.terms,
    );

    const fieldErrors = computed(() => ({
        fullName:
            touched.fullName && !form.fullName
                ? t("auth.register.errors.fullNameRequired")
                : undefined,
        company:
            touched.company && !form.company
                ? t("auth.register.errors.companyRequired")
                : undefined,
        email:
            touched.email && !isEmailValid.value
                ? t("auth.register.errors.emailInvalid")
                : undefined,
        password:
            touched.password && !isPasswordValid.value
                ? t("auth.register.errors.passwordInvalid")
                : undefined,
        confirmPassword:
            touched.confirmPassword && !passwordsMatch.value
                ? t("auth.register.errors.confirmPasswordMismatch")
                : undefined,
        terms:
            touched.terms && !form.terms
                ? t("auth.register.errors.termsRequired")
                : undefined,
    }));

    const handleSubmit = async () => {
        (Object.keys(touched) as Array<keyof TouchState>).forEach((key) => {
            touched[key] = true;
        });

        if (!canSubmit.value) {
            status.value = t("auth.register.errors.incomplete");
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    await authService.register({
                        fullName: form.fullName.trim(),
                        companyName: form.company.trim(),
                        email: form.email.trim(),
                        password: form.password,
                    });
                },
                {
                    loadingRef: submitting,
                    successMessage: t("auth.register.toastSuccess"),
                    errorMessage: t("auth.register.toastError"),
                },
            );
            await router.replace("/login");
        } catch (error: unknown) {
            status.value =
                error instanceof Error
                    ? error.message
                    : t("auth.register.fallbackError");
        }
    };

    return {
        form,
        touched,
        submitting,
        status,
        isEmailValid,
        isPasswordValid,
        passwordsMatch,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
```

- [ ] **Step 4: Migrate `RegisterPage.vue`**

```vue
<template>
    <AuthShell
        :form-title="t('auth.register.title')"
        :form-subtitle="t('auth.register.subtitle')"
    >
        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_RegisterName"
                    v-model="form.fullName"
                    :label="t('auth.register.fullNameLabel')"
                    :placeholder="t('auth.register.fullNamePlaceholder')"
                    autocomplete="name"
                    :error="fieldErrors.fullName"
                    object-id="txt_RegisterName"
                    @blur="touched.fullName = true"
                />

                <Input
                    id="txt_RegisterCompany"
                    v-model="form.company"
                    :label="t('auth.register.companyLabel')"
                    :placeholder="t('auth.register.companyPlaceholder')"
                    autocomplete="organization"
                    :error="fieldErrors.company"
                    object-id="txt_RegisterCompany"
                    @blur="touched.company = true"
                />

                <Input
                    id="txt_RegisterEmail"
                    v-model="form.email"
                    type="email"
                    :label="t('auth.register.emailLabel')"
                    :placeholder="t('auth.register.emailPlaceholder')"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_RegisterEmail"
                    @blur="touched.email = true"
                />

                <div class="grid gap-5 sm:grid-cols-2">
                    <Input
                        id="txt_RegisterPassword"
                        v-model="form.password"
                        type="password"
                        :label="t('auth.register.passwordLabel')"
                        :placeholder="t('auth.register.passwordPlaceholder')"
                        autocomplete="new-password"
                        :error="fieldErrors.password"
                        object-id="txt_RegisterPassword"
                        @blur="touched.password = true"
                    />

                    <Input
                        id="txt_RegisterConfirmPassword"
                        v-model="form.confirmPassword"
                        type="password"
                        :label="t('auth.register.confirmPasswordLabel')"
                        :placeholder="
                            t('auth.register.confirmPasswordPlaceholder')
                        "
                        autocomplete="new-password"
                        :error="fieldErrors.confirmPassword"
                        object-id="txt_RegisterConfirmPassword"
                        @blur="touched.confirmPassword = true"
                    />
                </div>

                <CheckboxField
                    v-model="form.terms"
                    :label="t('auth.register.termsLabel')"
                    object-id="chk_RegisterTerms"
                    :error="fieldErrors.terms"
                    align="start"
                    @blur="touched.terms = true"
                />

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_RegisterSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{
                        submitting
                            ? t("auth.register.submitting")
                            : t("auth.register.submit")
                    }}
                </Button>

                <div class="text-center text-xs text-text-secondary">
                    <p>{{ t("auth.register.alreadyHaveAccount") }}</p>
                    <RouterLink
                        id="lkl_RegisterLogin"
                        to="/login"
                        data-testid="lkl_RegisterLogin"
                        class="font-semibold text-primary-600 hover:text-primary-700"
                        >{{ t("auth.register.loginLink") }}</RouterLink
                    >
                </div>

                <InlineAlert
                    v-if="status"
                    variant="info"
                    :description="status"
                    compact
                    class="text-xs"
                />
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import CheckboxField from "@/components/ui/form/CheckboxField.vue";
import { useRegister } from "./composables/useRegister";

const {
    form,
    touched,
    submitting,
    status,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useRegister();

const { t } = useI18n();
</script>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/views/auth/loginFormUsage.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/auth/RegisterPage.vue src/views/auth/composables/useRegister.ts src/views/auth/loginFormUsage.test.ts
git commit -m "feat: translate RegisterPage and useRegister via vue-i18n"
```

---

### Task 11: Migrate `ForgotPasswordPage.vue` + `useForgotPassword.ts`

**Files:**
- Modify: `src/views/auth/ForgotPasswordPage.vue`
- Modify: `src/views/auth/composables/useForgotPassword.ts`
- Test: `src/views/auth/forgotPasswordI18n.test.ts`

**Interfaces:**
- Consumes: `auth.forgotPassword.*` keys (Task 3).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import forgotPasswordSource from "./ForgotPasswordPage.vue?raw";
import useForgotPasswordSource from "./composables/useForgotPassword.ts?raw";

describe("ForgotPasswordPage i18n usage", () => {
    it("resolves copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(forgotPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(forgotPasswordSource).toContain("auth.forgotPassword.submit");
        expect(forgotPasswordSource).not.toContain("Lupa password?");
    });

    it("resolves validation and toast copy in the composable through t()", () => {
        expect(useForgotPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(useForgotPasswordSource).toContain(
            "auth.forgotPassword.errors.emailInvalid",
        );
        expect(useForgotPasswordSource).not.toContain(
            "Gunakan email valid perusahaan.",
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/auth/forgotPasswordI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `useForgotPassword.ts`**

```typescript
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authService } from "@/services/auth.service";
import { useNotifier } from "@/composable/useNotifier";

export function useForgotPassword() {
    const { withToast } = useNotifier();
    const { t } = useI18n();

    const form = reactive({
        email: "",
    });

    const touched = reactive({
        email: false,
    });

    const submitting = ref(false);
    const submitted = ref(false);
    const status = ref<string | null>(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = computed(() => emailPattern.test(form.email));
    const canSubmit = computed(() => isEmailValid.value);

    const fieldErrors = computed(() => ({
        email:
            touched.email && !isEmailValid.value
                ? t("auth.forgotPassword.errors.emailInvalid")
                : undefined,
    }));

    const handleSubmit = async () => {
        touched.email = true;

        if (!canSubmit.value) {
            status.value = t("auth.forgotPassword.errors.emailRequired");
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    await authService.forgotPassword(form.email.trim());
                },
                {
                    loadingRef: submitting,
                    successMessage: t("auth.forgotPassword.toastSuccess"),
                    errorMessage: t("auth.forgotPassword.toastError"),
                },
            );

            // The backend always resolves regardless of whether the email is
            // registered, so reaching here never confirms account existence.
            submitted.value = true;
        } catch {
            status.value = t("auth.forgotPassword.unexpectedError");
        }
    };

    return {
        form,
        touched,
        submitting,
        submitted,
        status,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
```

- [ ] **Step 4: Migrate `ForgotPasswordPage.vue`**

```vue
<template>
    <AuthShell
        :form-title="t('auth.forgotPassword.title')"
        :form-subtitle="t('auth.forgotPassword.subtitle')"
    >
        <template #default>
            <form
                v-if="!submitted"
                class="space-y-5"
                @submit.prevent="handleSubmit"
            >
                <Input
                    id="txt_ForgotPasswordEmail"
                    v-model="form.email"
                    type="email"
                    :label="t('auth.forgotPassword.emailLabel')"
                    label-class="sr-only"
                    :placeholder="t('auth.forgotPassword.emailPlaceholder')"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_ForgotPasswordEmail"
                    @blur="touched.email = true"
                />

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_ForgotPasswordSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{
                        submitting
                            ? t("auth.forgotPassword.submitting")
                            : t("auth.forgotPassword.submit")
                    }}
                </Button>

                <InlineAlert
                    v-if="status"
                    variant="error"
                    :description="status"
                    compact
                    class="text-xs"
                />
            </form>

            <InlineAlert
                v-else
                variant="success"
                :description="t('auth.forgotPassword.bannerSuccess')"
                compact
                class="text-xs"
            />

            <p class="mt-6 text-sm text-text-secondary">
                {{ t("auth.forgotPassword.rememberPrompt") }}
                <RouterLink
                    id="lkl_ForgotPasswordBackToLogin"
                    to="/login"
                    data-testid="lkl_ForgotPasswordBackToLogin"
                    class="font-semibold text-primary-600 hover:text-primary-700"
                    >{{ t("auth.forgotPassword.backToLogin") }}</RouterLink
                >
            </p>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import { useForgotPassword } from "./composables/useForgotPassword";

const {
    form,
    touched,
    submitting,
    submitted,
    status,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useForgotPassword();

const { t } = useI18n();
</script>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/views/auth/forgotPasswordI18n.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/auth/ForgotPasswordPage.vue src/views/auth/composables/useForgotPassword.ts src/views/auth/forgotPasswordI18n.test.ts
git commit -m "feat: translate ForgotPasswordPage and useForgotPassword via vue-i18n"
```

---

### Task 12: Migrate `ResetPasswordPage.vue` + `useResetPassword.ts`

**Files:**
- Modify: `src/views/auth/ResetPasswordPage.vue`
- Modify: `src/views/auth/composables/useResetPassword.ts`
- Test: `src/views/auth/resetPasswordI18n.test.ts`

**Interfaces:**
- Consumes: `auth.resetPassword.*` keys (Task 3).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import resetPasswordSource from "./ResetPasswordPage.vue?raw";
import useResetPasswordSource from "./composables/useResetPassword.ts?raw";

describe("ResetPasswordPage i18n usage", () => {
    it("resolves copy through vue-i18n instead of hardcoded Indonesian text", () => {
        expect(resetPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(resetPasswordSource).toContain("auth.resetPassword.submit");
        expect(resetPasswordSource).not.toContain("Atur ulang password");
    });

    it("resolves validation and toast copy in the composable through t()", () => {
        expect(useResetPasswordSource).toContain(
            'import { useI18n } from "vue-i18n"',
        );
        expect(useResetPasswordSource).toContain(
            "auth.resetPassword.errors.invalidLink",
        );
        expect(useResetPasswordSource).not.toContain(
            "Tautan reset password tidak valid atau sudah kedaluwarsa.",
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/auth/resetPasswordI18n.test.ts`
Expected: FAIL — source still hardcoded.

- [ ] **Step 3: Migrate `useResetPassword.ts`**

```typescript
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { authService } from "@/services/auth.service";
import { useNotifier } from "@/composable/useNotifier";

function extractAccessTokenFromHash(hash: string): string | null {
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(cleaned);
    return params.get("access_token");
}

export function useResetPassword() {
    const router = useRouter();
    const { withToast } = useNotifier();
    const { t } = useI18n();

    const accessToken = ref<string | null>(null);
    const linkError = ref<string | null>(null);

    const form = reactive({
        password: "",
        confirmPassword: "",
    });

    const touched = reactive({
        password: false,
        confirmPassword: false,
    });

    const submitting = ref(false);
    const status = ref<string | null>(null);

    const isPasswordValid = computed(() => form.password.length >= 10);
    const passwordsMatch = computed(
        () => form.password && form.password === form.confirmPassword,
    );
    const canSubmit = computed(
        () =>
            Boolean(accessToken.value) &&
            isPasswordValid.value &&
            passwordsMatch.value,
    );

    const fieldErrors = computed(() => ({
        password:
            touched.password && !isPasswordValid.value
                ? t("auth.resetPassword.errors.passwordInvalid")
                : undefined,
        confirmPassword:
            touched.confirmPassword && !passwordsMatch.value
                ? t("auth.resetPassword.errors.confirmPasswordMismatch")
                : undefined,
    }));

    onMounted(() => {
        const token = extractAccessTokenFromHash(window.location.hash);
        if (!token) {
            linkError.value = t("auth.resetPassword.errors.invalidLink");
            return;
        }
        accessToken.value = token;
    });

    const handleSubmit = async () => {
        touched.password = true;
        touched.confirmPassword = true;

        if (!canSubmit.value || !accessToken.value) {
            status.value = t("auth.resetPassword.errors.incomplete");
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    await authService.resetPassword(
                        accessToken.value as string,
                        form.password,
                    );
                },
                {
                    loadingRef: submitting,
                    successMessage: t("auth.resetPassword.toastSuccess"),
                    errorMessage: t("auth.resetPassword.toastError"),
                },
            );

            await router.replace("/login");
        } catch (error) {
            status.value =
                error instanceof Error
                    ? error.message
                    : t("auth.resetPassword.errors.invalidLink");
        }
    };

    return {
        form,
        touched,
        submitting,
        status,
        linkError,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
```

- [ ] **Step 4: Migrate `ResetPasswordPage.vue`**

```vue
<template>
    <AuthShell
        :form-title="t('auth.resetPassword.title')"
        :form-subtitle="t('auth.resetPassword.subtitle')"
    >
        <template #default>
            <InlineAlert
                v-if="linkError"
                variant="error"
                :description="linkError"
                compact
                class="text-xs"
            />

            <form v-else class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_ResetPasswordPassword"
                    v-model="form.password"
                    type="password"
                    :label="t('auth.resetPassword.passwordLabel')"
                    :placeholder="t('auth.resetPassword.passwordPlaceholder')"
                    autocomplete="new-password"
                    :error="fieldErrors.password"
                    object-id="txt_ResetPasswordPassword"
                    @blur="touched.password = true"
                />

                <Input
                    id="txt_ResetPasswordConfirmPassword"
                    v-model="form.confirmPassword"
                    type="password"
                    :label="t('auth.resetPassword.confirmPasswordLabel')"
                    :placeholder="
                        t('auth.resetPassword.confirmPasswordPlaceholder')
                    "
                    autocomplete="new-password"
                    :error="fieldErrors.confirmPassword"
                    object-id="txt_ResetPasswordConfirmPassword"
                    @blur="touched.confirmPassword = true"
                />

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_ResetPasswordSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{
                        submitting
                            ? t("auth.resetPassword.submitting")
                            : t("auth.resetPassword.submit")
                    }}
                </Button>

                <InlineAlert
                    v-if="status"
                    variant="error"
                    :description="status"
                    compact
                    class="text-xs"
                />
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import { useResetPassword } from "./composables/useResetPassword";

const {
    form,
    touched,
    submitting,
    status,
    linkError,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useResetPassword();

const { t } = useI18n();
</script>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/views/auth/resetPasswordI18n.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/auth/ResetPasswordPage.vue src/views/auth/composables/useResetPassword.ts src/views/auth/resetPasswordI18n.test.ts
git commit -m "feat: translate ResetPasswordPage and useResetPassword via vue-i18n"
```

---

### Task 13: Add the language switcher to the Profile page

**Files:**
- Modify: `src/views/profile/ProfilePage.vue`
- Modify: `src/views/profile/composables/useProfile.ts`
- Test: `src/views/profile/profileLanguageSwitcher.test.ts`

**Interfaces:**
- Consumes: `useLocaleStore()` (Task 6), `common.language.*` keys (Task 2).
- Scope note: only the language switcher itself is added here. The rest of `ProfilePage.vue`'s existing Indonesian copy (account details, access card, etc.) is migrated in the future Settings/Profile module plan, not in this task.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import profilePageSource from "./ProfilePage.vue?raw";
import useProfileSource from "./composables/useProfile.ts?raw";

describe("ProfilePage language switcher", () => {
    it("renders a SegmentedControl bound to the locale store options", () => {
        expect(profilePageSource).toContain("SegmentedControl");
        expect(profilePageSource).toContain("currentLocale");
        expect(profilePageSource).toContain("localeOptions");
        expect(profilePageSource).toContain("common.language.label");
    });

    it("exposes locale state and a setter from useProfile via the locale store", () => {
        expect(useProfileSource).toContain(
            'import { useLocaleStore } from "@/store/locale.store"',
        );
        expect(useProfileSource).toContain("currentLocale");
        expect(useProfileSource).toContain("localeOptions");
        expect(useProfileSource).toContain("setLocale");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/profile/profileLanguageSwitcher.test.ts`
Expected: FAIL — `SegmentedControl` / `currentLocale` not found in source.

- [ ] **Step 3: Add the switcher logic to `useProfile.ts`**

```typescript
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/store/auth.store";
import { useLocaleStore } from "@/store/locale.store";

export function useProfile() {
    const router = useRouter();
    const authStore = useAuthStore();
    const localeStore = useLocaleStore();
    const { t } = useI18n();
    const processing = ref(false);
    const status = ref<string | null>(null);

    const profile = computed(() => authStore.profile);
    const permissions = computed(() => profile.value?.permissions ?? []);
    const menuTreeCount = computed(() => profile.value?.menuTree?.length ?? 0);
    const currentCompany = computed(
        () =>
            profile.value?.companies.find(
                (company) =>
                    company.companyId === profile.value?.currentCompanyId,
            ) ?? null,
    );

    const currentLocale = computed(() => localeStore.locale);
    const localeOptions = computed(() => [
        { label: t("common.language.indonesian"), value: "id" },
        { label: t("common.language.english"), value: "en" },
    ]);
    const setLocale = (locale: string) => {
        if (locale === "id" || locale === "en") {
            localeStore.setLocale(locale);
        }
    };

    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        return "Gagal memproses permintaan.";
    };

    const handleLogout = async () => {
        processing.value = true;
        status.value = null;
        try {
            await authStore.logout();
            await router.replace("/login");
        } catch (error) {
            status.value = getErrorMessage(error);
        } finally {
            processing.value = false;
        }
    };

    return {
        profile,
        permissions,
        menuTreeCount,
        currentCompany,
        processing,
        status,
        currentLocale,
        localeOptions,
        setLocale,
        handleLogout,
    };
}
```

- [ ] **Step 4: Add the switcher UI to `ProfilePage.vue`**

Add this new `<Card>` block right after the closing `</div>` of the two-column grid (`Informasi Akun` / `Hak Akses`), and before the `<InlineAlert v-if="status" ...>` block:

```vue
        <Card object-id="wdg_ProfileLanguage">
            <div class="flex items-center justify-between gap-4">
                <p class="text-sm font-semibold text-text">
                    {{ t("common.language.label") }}
                </p>
                <SegmentedControl
                    :model-value="currentLocale"
                    :options="localeOptions"
                    object-id-prefix="btn_ProfileLanguage"
                    @update:model-value="setLocale"
                />
            </div>
        </Card>
```

Update the script block:

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import SegmentedControl from "@/components/molecules/SegmentedControl.vue";
import { useProfile } from "./composables/useProfile";

const {
    profile,
    permissions,
    menuTreeCount,
    currentCompany,
    processing,
    status,
    currentLocale,
    localeOptions,
    setLocale,
    handleLogout,
} = useProfile();

const { t } = useI18n();
</script>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/views/profile/profileLanguageSwitcher.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/profile/ProfilePage.vue src/views/profile/composables/useProfile.ts src/views/profile/profileLanguageSwitcher.test.ts
git commit -m "feat: add language switcher to Profile page"
```

---

### Task 14: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `npm run test:unit`
Expected: all tests pass, including every test added in Tasks 2–13.

- [ ] **Step 2: Type-check the whole project**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev`, open `/login` in a browser, confirm the page renders in Indonesian by default (no console errors about missing i18n keys), then go to `/profile` (after logging in) and toggle the language switcher between Indonesia/English, confirming Login/Register/Forgot/Reset copy changes language on next visit to those pages (locale is global and persists across a reload).

- [ ] **Step 5: Commit (if anything was adjusted during verification)**

```bash
git add -A
git commit -m "chore: verify i18n foundation and auth module migration"
```

---

## Follow-up (not in this plan)

Each of the following gets its own plan, generated the same way (read the actual files, extract literal strings, define a namespace, migrate with TDD):

- Dashboard (`dashboard.json`)
- IAM / Users (`iam.json`)
- Master Data (`masterData.json`) — includes the `entityConfig.ts` label-to-key migration described in the design spec
- Transactions (`transactions.json`) — includes status/badge label key migration
- Stock Opname (`opname.json`)
- Stock (`stock.json`)
- RFID / Log (`rfid.json`)
- Reports (`reports.json`) — includes `reportConfig.ts` label-to-key migration
- Settings + rest of Profile (`settings.json`) — the remaining hardcoded text on `ProfilePage.vue` beyond the switcher added in Task 13
- Shared `atoms/`, `molecules/`, `organisms/` design-system components with hardcoded copy (extends `common.json`)
- Form validation messages built with zod schema factories in modules that use vee-validate + zod (`validation.json`) — Auth module didn't need this since its forms use ad-hoc computed validation, not zod schemas
