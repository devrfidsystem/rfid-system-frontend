# i18n: Indonesian + English Support — Design

- Date: 2026-08-16
- Status: Approved for planning

## Context

The application (`rfid-web-app`, Vue 3 SPA) has no internationalization setup today. All UI text across 134 `.vue` files is hardcoded (a mix of Indonesian and English strings). The user wants full multi-language support for **Indonesian (id)** and **English (en)**, covering the entire application in one project (not an incremental per-module rollout).

Reference: `.docs/FEATURE_MAP.md`, `.docs/BUSINESS_FLOW.md`, `.docs/PROJECT_PROFILE.md` for existing module/feature inventory and architecture conventions.

## Goals

- Every static UI string (labels, buttons, page titles, menu items, empty states, table headers, badges/status labels defined in frontend, form validation messages) is translatable between `id` and `en`.
- Default locale is **Indonesian (`id`)** on first load, no browser-locale auto-detection.
- User can change language as a saved preference on the **Profile page**.
- Locale choice persists across sessions (`localStorage`), reactive without page reload.
- Out of scope: translating content that originates from the backend (server error messages, product/customer names, raw API payload values) and translating anything not currently defined as a frontend string (e.g. new backend-driven i18n contracts).

## Non-Goals

- No backend/API changes. No new backend error-code-to-message contract.
- No automatic browser-language detection.
- No topbar quick-switcher — locale switch lives only on the Profile page, per approved decision.

## Architecture

### Library

`vue-i18n` (v9+, Vue 3, Composition API mode, `legacy: false`), registered as a **global-scope** i18n instance (single source of truth), not per-component local messages. Chosen over a custom/home-grown i18n utility to avoid reimplementing interpolation, pluralization, and locale-aware formatting that vue-i18n already provides.

### Locale file structure

```
src/locales/
  id/
    common.json        # shared: buttons, pagination, generic actions
    auth.json
    dashboard.json
    iam.json
    masterData.json
    transactions.json
    opname.json
    stock.json
    rfid.json
    reports.json
    settings.json
    validation.json     # form/zod validation messages
  en/
    (mirrors the same file set and key structure)
  index.ts              # merges per-namespace JSON into vue-i18n messages, creates the i18n instance
```

Namespaces mirror the existing `src/views/<feature>` breakdown from `FEATURE_MAP.md`, so migration work maps 1:1 onto known feature boundaries. Keys are nested per feature, e.g. `transactions.list.title`, `transactions.actions.post`, `masterData.form.validation.required`.

### Locale store (`src/store/locale.store.ts`)

Pattern mirrors the existing `src/store/theme.store.ts`:

- State: `locale: 'id' | 'en'`, `initialized: boolean`.
- `STORAGE_KEYS.locale = 'rfid-locale'`.
- `initialize()`: reads `localStorage`, defaults to `'id'` if unset or invalid; called once in `main.ts` before mount.
- `setLocale(locale)`: updates store state, writes to `localStorage`, and sets `i18n.global.locale.value` so the change is immediately reactive across the app — no reload required.

### Migration pattern for existing text (cross-cutting rule)

**Config and DTO layers store i18n keys, not literal text. Resolution to display text always happens at the render site via `t()`.**

- **Templates**: literal strings replaced with `{{ t('namespace.key') }}` via `useI18n()` in `<script setup>`.
- **Cross-cutting config** (`src/domain/master/entityConfig.ts`, `src/domain/report/reportConfig.ts`): label/description/title fields become i18n keys; views/components resolve them with `t(key)` at the point of use, keeping config itself locale-agnostic and reactive to locale switches.
- **Status/badge labels** (transaction status Draft/Posted/etc., tone maps in `transactions.dto.ts` and similar): mapping functions return i18n keys; the Badge/consuming component resolves via `t()`.
- **Form validation** (zod + vee-validate): schema builders become factory functions accepting `t` (e.g. `buildSchema(t)`), invoked inside the owning composable at setup time so messages stay in sync with the active locale.
- **Dynamic page titles** (if set via `document.title` or route meta): resolved through `t()` in the layout/guard, not stored as literal strings in route meta.

### Scope boundary (confirmed)

Translated: static frontend UI text + any label/status text currently defined/mapped in frontend code (badges, config-driven labels, validation messages).
Not translated: backend-originated content (server error messages, entity data values, report row data).

## Testing

- Existing Vitest unit/component tests that assert literal text (e.g. `expect(wrapper.text()).toContain('Simpan')`) are updated to assert against the `id` default-locale text or the translation key, since `id` remains the default in test environment setup.
- New architecture-guard test (same convention as existing guard tests under `src/config`) that scans `src/locales/id/**` against `src/locales/en/**` to assert **key parity** in both directions — catches a missing translation before it reaches production without requiring manual per-file review.
- No new e2e/regression suite; existing Selenium e2e/regression scripts continue running against the default `id` locale.

## Rollout

Full-coverage in one project, organized by the module boundaries in `FEATURE_MAP.md` (Auth, Dashboard, IAM, Master Data, Transactions, Stock Opname, Stock, RFID/Log, Reports, Settings/Profile, plus shared atoms/molecules/organisms). The implementation plan will sequence these as file-by-file checklists per module, consistent with prior large plans in this repo (e.g. the putaway file-by-file plan).

## Risks / Considerations

- Zod schema factories touch every form composable that currently builds validation schemas statically — this is the largest mechanical-refactor surface in the migration.
- Shared design-system components (`atoms/`, `molecules/`, `organisms/`) that currently hardcode text (e.g. default button labels, empty-state copy) need a `common` namespace and may require prop-level override support for feature-specific copy.
- Key-parity guard test must be added early so subsequent module PRs are self-checking rather than relying on manual bilingual review.
