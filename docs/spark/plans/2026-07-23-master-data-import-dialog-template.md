# Master Data Import Dialog Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct Master Data Excel import with an import dialog that also exports an Excel template per Master Data page.

**Architecture:** Keep ownership inside `src/views/master`. Excel generation/parsing stays in `masterExcel.ts`; `useMasterEntity` exposes page-level import/export actions; `MasterHeader.vue` owns the dialog and selected-file state.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vitest, `xlsx`, existing atom components.

## Global Constraints

- Every Master Data page uses the same header/dialog behavior through `MasterEntityPage.vue`.
- Import format remains Excel (`.xlsx`/`.xls`).
- Export template must be based on importable form fields, not display-only table columns.
- Existing data export remains unchanged.

---

### Task 1: Excel Template Helper

**Files:**
- Modify: `src/views/master/masterExcel.ts`
- Modify: `src/views/master/masterExcel.test.ts`

**Interfaces:**
- Produces: `exportMasterTemplateToExcel({ columns, filename, sheetName }): void`

- [ ] Add a unit test proving template export builds one blank row with the expected headers.
- [ ] Implement `exportMasterTemplateToExcel` using the existing workbook helper.
- [ ] Run `npx vitest run src/views/master/masterExcel.test.ts`.

### Task 2: Import Dialog UI

**Files:**
- Modify: `src/views/master/components/MasterHeader.vue`
- Modify: `src/views/master/components/MasterHeader.test.ts`

**Interfaces:**
- Consumes: `isImporting?: boolean`
- Emits: `import(file: File)`, `export`, `export-template`

- [ ] Change the Import button to open a modal dialog.
- [ ] Move file input inside the dialog.
- [ ] Add `Export Template`, `Cancel`, and `Import` dialog actions.
- [ ] Disable dialog import until a file is selected or while import is loading.
- [ ] Add/update tests for opening the dialog, exporting template, and emitting selected file.
- [ ] Run `npx vitest run src/views/master/components/MasterHeader.test.ts`.

### Task 3: Master Data Wiring

**Files:**
- Modify: `src/views/master/MasterEntityPage.vue`
- Modify: `src/views/master/composables/useMasterEntity.ts`

**Interfaces:**
- Produces: `handleExportTemplate(): void`

- [ ] Create import-template column definitions from `formFields`, excluding file fields and dynamic `attribute:` product fields.
- [ ] Wire `handleExportTemplate` into `MasterHeader`.
- [ ] Run focused Master Data tests and type-check.
