# Design System Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Warehouse frontend design system so shared primitives have clearer ownership, semantic status tones are visually distinct, and high-use components consume design tokens instead of raw Tailwind color families.

**Architecture:** Keep the existing atomic design layer as the foundation (`atoms`, `molecules`, `organisms`, `templates`). Treat `components/ui/*` as compatibility and feature-focused facades that compose foundation primitives. Limit production changes to shared primitives and documentation to avoid broad feature-page visual regression.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Vitest SSR component tests.

## Global Constraints

- Do not refactor feature pages in bulk during this pass.
- Write a failing test before changing `Badge.vue`.
- Keep visual changes scoped to semantic classes already supported by `tailwind.config.ts`.
- Preserve existing public props and imports.

---

### Task 1: Badge Semantic Tones

**Files:**
- Create: `src/components/atoms/Badge.test.ts`
- Modify: `src/components/atoms/Badge.vue`

**Interfaces:**
- Consumes: `tone?: "neutral" | "success" | "warning" | "error" | "info" | "purple" | "teal"`
- Produces: visually distinct class mappings for `teal` and `purple`

- [ ] **Step 1: Write the failing test**
  Add SSR assertions that `success`, `teal`, `info`, and `purple` do not render as duplicate tone class groups.

- [ ] **Step 2: Run the test to verify it fails**
  Run: `npx vitest run src/components/atoms/Badge.test.ts`
  Expected: fail because `teal` aliases `success` and `purple` aliases `info`.

- [ ] **Step 3: Update Badge tone classes**
  Use Tailwind semantic and constrained color classes so each tone reads differently.

- [ ] **Step 4: Run the test to verify it passes**
  Run: `npx vitest run src/components/atoms/Badge.test.ts`
  Expected: pass.

### Task 2: Tokenize High-Use Primitives

**Files:**
- Modify: `src/components/molecules/Card.vue`
- Modify: `src/components/molecules/EmptyState.vue`
- Modify: `src/components/ui/feedback/EmptyState.vue`

**Interfaces:**
- Produces: primitive classes based on `surface`, `surface-secondary`, `border`, `text`, and `text-secondary`.

- [ ] **Step 1: Replace raw neutral classes in Card**
  Change `border-gray-200 bg-white` to `border-border bg-surface`.

- [ ] **Step 2: Replace raw neutral classes in EmptyState components**
  Change `gray` classes to semantic token classes while preserving layout.

### Task 3: Document Component Ownership

**Files:**
- Create: `src/components/README.md`

**Interfaces:**
- Produces: local design-system ownership rules for future implementation.

- [ ] **Step 1: Document namespace boundary**
  State that `atoms/molecules/organisms/templates` are foundation components and `ui/*` wraps or composes them.

- [ ] **Step 2: Document token and status rules**
  Require semantic tokens for shared components and `Badge` for status labels.

### Task 4: Verification

**Files:**
- Read: `package.json`

- [ ] **Step 1: Run focused component tests**
  Run: `npx vitest run src/components/atoms/Badge.test.ts src/components/organisms/DataTable/DataTable.test.ts`

- [ ] **Step 2: Run type-check**
  Run: `npm run type-check`
