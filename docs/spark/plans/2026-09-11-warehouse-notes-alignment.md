# Warehouse Notes Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved warehouse workflow corrections across backend, web, and mobile.

**Architecture:** Backend owns stock/document mutations; web and mobile use explicit DTOs and local temporary scan state. Existing module boundaries and colocated tests remain unchanged.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Vue 3/Vite/TypeScript/Vitest, Flutter/Dart/BLoC.

## Global Constraints

- Do not commit or push changes.
- Preserve existing user changes in the working trees.
- Use test-first changes for behavior modifications.
- Keep Transfer out of user-facing flow while retaining only compatibility code required by existing data.

### Task 1: Opname Relocation contract and mutation

**Files:**
- Modify: `Warehouse-be/src/modules/warehouse/opname/dto/opname-doc.dto.ts`
- Modify: `Warehouse-be/src/modules/warehouse/opname/opname-mutation.service.ts`
- Modify: `Warehouse-be/src/modules/warehouse/opname/opname.controller.ts`
- Test: `Warehouse-be/src/modules/warehouse/opname/opname-mutation.service.spec.ts`

- [ ] Add a failing test proving Opname relocation receives destination fields and creates a Relocation document/movement.
- [ ] Run the focused Jest spec and confirm the expected failure.
- [ ] Add the minimal DTO/controller/service implementation.
- [ ] Run the focused Jest spec and confirm it passes.

### Task 2: Web Opname action UI

**Files:**
- Modify: `Warehouse/src/views/opname/composables/useOpnameDetail.ts`
- Modify: `Warehouse/src/views/opname/OpnameDetailPage.vue`
- Test: `Warehouse/src/views/opname/composables/useOpnameDetail.test.ts`

- [ ] Add a failing test for relocation destination input and payload.
- [ ] Implement destination warehouse/location fields and call the backend relocation action.
- [ ] Verify Opname tests.

### Task 3: Document numbering and Transfer cleanup

**Files:**
- Modify: `Warehouse/src/views/transactions/TransactionCreatePage.vue`
- Modify: `Warehouse/src/views/transactions/composables/useTransactionCreate.ts`
- Modify: `Warehouse/src/router/index.ts`
- Modify: `Warehouse/src/views/transactions/composables/useTransactionList.ts`
- Modify: `Warehouse/src/api/feature/dto/transactions.dto.ts`
- Test: transaction/router tests

- [ ] Add regression tests for read-only generated document numbers and no active Transfer route.
- [ ] Implement the smallest UI/route cleanup.
- [ ] Run focused Vitest tests.

### Task 4: Outbound mobile temporary scan state

**Files:**
- Modify: `rfid_system_app/lib/features/stock_out/presentation/pages/stock_out_task_detail_page.dart`
- Modify: `rfid_system_app/lib/features/stock_out/presentation/bloc/stock_out_task_detail_bloc.dart`
- Test: existing stock-out BLoC/widget tests where available

- [ ] Add a regression test or assertion for no visible `In progress` label.
- [ ] Remove only the business-facing label/state presentation while retaining scan gating.
- [ ] Verify with Flutter tooling if available.

### Task 5: Opname submit progress and final verification

**Files:**
- Modify: `rfid_system_app/lib/features/stock_opname/presentation/pages/opname_task_detail_page.dart`
- Modify: `rfid_system_app/lib/features/stock_opname/presentation/widgets/opname_rack_list_widget.dart`
- Test: existing stock-opname tests

- [ ] Add progress display for submitted locations.
- [ ] Verify reconcile remains gated on all selected locations.
- [ ] Run backend tests, frontend tests, and available mobile checks.
