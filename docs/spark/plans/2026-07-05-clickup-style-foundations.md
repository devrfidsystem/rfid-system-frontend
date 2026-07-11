# ClickUp-Style Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize the shared UI foundation so master data and other dense admin pages use the same compact, neutral, ClickUp-style controls.

**Architecture:** Keep the work in the existing shared component layer first, then let feature pages inherit the new look automatically. The shared atoms handle control sizing, color semantics, and disabled/focus states; table/layout components consume those atoms without per-page overrides.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, lucide-vue-next, Vite, Vitest/browser tests where available.

## Global Constraints

- Density over decoration.
- Neutral-first visuals; semantic colors only for status and destructive states.
- Interactive controls use fixed heights from the design tokens, not ad hoc padding.
- Body text defaults to compact admin UI sizing, not landing-page sizing.
- Keep component APIs stable unless a usage site must change with the new foundation.

---

### Task 1: Rework shared form atoms

**Files:**
- Modify: `src/components/atoms/Button.vue`
- Modify: `src/components/atoms/Input.vue`
- Modify: `src/components/atoms/Select.vue`
- Modify: `src/components/atoms/Badge.vue`

**Interfaces:**
- Consumes: existing `variant`, `size`, `tone`, `label`, `hint`, `error`, `invalid`, and `objectId` props.
- Produces: compact button, input, select, and badge visuals that match the shared design system tokens.

- [ ] **Step 1: Inspect current props and class composition**
- [ ] **Step 2: Update each atom to use compact neutral-first classes**
- [ ] **Step 3: Keep existing props and emitted events stable**
- [ ] **Step 4: Verify the atoms still render correctly in the app shell**

### Task 2: Align table navigation primitives

**Files:**
- Modify: `src/components/ui/table/Pagination.vue`
- Modify: `src/components/organisms/DataTable/DataTable.vue` if shared table spacing or action layout still diverges
- Modify: `src/components/ui/feedback/EmptyState.vue` if empty-state spacing conflicts with dense admin layouts

**Interfaces:**
- Consumes: existing `page`, `pageSize`, `total`, and table column props.
- Produces: compact pagination controls and table spacing consistent with dense admin pages.

- [ ] **Step 1: Bring pagination controls in line with shared control heights**
- [ ] **Step 2: Normalize table row density and cell typography**
- [ ] **Step 3: Keep sort, empty state, and action slots behavior unchanged**
- [ ] **Step 4: Verify table pages still paginate and render correctly**

### Task 3: Normalize global page chrome

**Files:**
- Modify: `src/components/organisms/Sidebar.vue`
- Modify: `src/components/molecules/PageHeader.vue`

**Interfaces:**
- Consumes: existing nav tree, collapsed state, tagline/title/description slots.
- Produces: denser sidebar and page headers that fit the shared admin language.

- [ ] **Step 1: Reduce oversized spacing and align typography with compact tokens**
- [ ] **Step 2: Keep active states and navigation behavior intact**
- [ ] **Step 3: Verify the header and sidebar still work across routes**

### Task 4: Apply the foundation to Master Data pages

**Files:**
- Modify: `src/views/master/components/MasterHeader.vue`
- Modify: `src/views/master/components/MasterTable.vue`
- Modify: `src/views/master/components/MasterFormModal.vue`
- Modify: related master view/composable files only if a field layout depends on the shared atoms

**Interfaces:**
- Consumes: shared atoms, dense table primitives, and existing master data field configs.
- Produces: master data pages that automatically inherit the new design system without page-specific styling hacks.

- [ ] **Step 1: Update master list header actions and search/filter layout**
- [ ] **Step 2: Reuse the new table and badge styles in list rows**
- [ ] **Step 3: Align create/update modal form controls with the shared atoms**
- [ ] **Step 4: Verify warehouse, location, supplier, customer, UOM, category, and product pages still submit and render correctly**

## Validation

- Run `npm run -s type-check`
- Run `npm run -s build`
- If the app is being checked in a browser, hard refresh or restart the dev server before concluding that a style change did not apply.

