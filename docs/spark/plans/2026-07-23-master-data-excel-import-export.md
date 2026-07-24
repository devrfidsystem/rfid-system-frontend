# Master Data Excel Import Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Excel `.xlsx` import and export actions to every supported Master Data page.

**Architecture:** Keep ownership inside the existing Master Data feature. The page passes current table rows and column definitions to a feature-local Excel helper for export, and import maps worksheet rows through the existing Master Data payload builder before calling `masterService.create`.

**Tech Stack:** Vue 3, TypeScript, Vitest, `xlsx`, existing Master Data composables and UI components.

## Global Constraints

- Use the existing `view/composable -> service -> api` layering.
- Support all current supported Master Data entities: attributes, warehouses, locations, products, customers, suppliers, uoms, and product-categories.
- Use real Excel `.xlsx` files, not CSV renamed as Excel.
- Do not introduce backend endpoint assumptions because no backend repository or OpenAPI contract is present.

---

### Task 1: Excel Helper

**Files:**
- Create: `src/views/master/masterExcel.ts`
- Test: `src/views/master/masterExcel.test.ts`

**Interfaces:**
- Produces: `exportMasterRowsToExcel(args): void`
- Produces: `parseMasterExcelFile(file: File): Promise<Record<string, string>[]>`

- [ ] **Step 1: Write failing helper tests**

Run: `npx vitest run src/views/master/masterExcel.test.ts`

Expected: FAIL because `masterExcel.ts` does not exist.

- [ ] **Step 2: Implement helper**

Use `xlsx` to create `.xlsx` workbooks and parse the first worksheet into plain row objects keyed by header labels.

- [ ] **Step 3: Verify helper tests pass**

Run: `npx vitest run src/views/master/masterExcel.test.ts`

Expected: PASS.

### Task 2: Master Data Wiring

**Files:**
- Modify: `src/views/master/components/MasterHeader.vue`
- Modify: `src/views/master/MasterEntityPage.vue`
- Modify: `src/views/master/composables/useMasterEntity.ts`
- Modify: `src/views/master/composables/useMasterForm.ts`
- Test: `src/views/master/entityConfig.test.ts`
- Test: `src/views/master/composables/useMasterForm.test.ts`

**Interfaces:**
- Consumes: `exportMasterRowsToExcel`
- Consumes: `parseMasterExcelFile`
- Produces: `handleExport(): void`
- Produces: `handleImport(file: File): Promise<void>`

- [ ] **Step 1: Write failing wiring tests**

Run: `npx vitest run src/views/master/composables/useMasterForm.test.ts`

Expected: FAIL until import rows call `masterService.create` through existing payload/context handling.

- [ ] **Step 2: Add header controls**

Add Import and Export buttons beside Refresh/Add using lucide icons and hidden file input for `.xlsx,.xls`.

- [ ] **Step 3: Wire page actions**

Expose handlers from `useMasterEntity`; page binds `@import` and `@export` to `MasterHeader`.

- [ ] **Step 4: Verify targeted tests**

Run: `npx vitest run src/views/master/entityConfig.test.ts src/views/master/masterPayload.test.ts src/views/master/masterExcel.test.ts src/views/master/composables/useMasterForm.test.ts`

Expected: PASS.

### Task 3: Final Verification

**Files:**
- Verify all files modified by Tasks 1-2.

- [ ] **Step 1: Run compiler**

Run: `npm run type-check`

Expected: PASS.

- [ ] **Step 2: Run Master Data tests**

Run: `npx vitest run src/views/master/entityConfig.test.ts src/views/master/masterPayload.test.ts src/views/master/masterExcel.test.ts src/views/master/composables/useMasterForm.test.ts src/views/master/locationTree.test.ts`

Expected: PASS.
