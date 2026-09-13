# Stock Opname Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing opname document flow into a recursive admin tree with explicit `group`, `profile`, and `task` nodes while preserving the existing task execution lifecycle.

**Architecture:** Extend the existing `OpnameDoc` model to carry tree metadata, then add tree-oriented query and mutation paths inside the current `opname` module. Expose a dedicated tree view for web admin, keep task execution semantics on `task` nodes, and leave the rest of the transaction modules untouched.

**Tech Stack:** Vue 3, TypeScript, NestJS, Prisma, Vitest, Postgres.

## Global Constraints

- Preserve the existing `opname` bounded context.
- `task` is the only executable node type for mobile execution flow.
- The tree must support arbitrary depth and free parent-child relationships.
- Existing stock adjustment behavior on close must continue to work for task nodes.
- Follow existing repo test patterns and use TDD for feature changes.

---

### Task 1: Extend opname persistence for recursive nodes

**Files:**

- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/prisma/schema.prisma`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/prisma/migrations/20260718000000_add_opname_tree_nodes/migration.sql`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/prisma/seed.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/constants/opname.constants.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/dto/opname-doc.dto.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/dto/opname-list-filter.dto.ts`
- Test: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/dto/opname-doc.dto.spec.ts`

**Interfaces:**

- Produces `OpnameNodeType` and `OPNAME_NODE_TYPES`.
- Adds `parentId`, `nodeType`, and optional tree metadata to `OpnameDoc`.
- Adds DTO validation for node type and parent assignment.

- [ ] **Step 1: Write the failing DTO and constant tests**
- [ ] **Step 2: Run the DTO tests and confirm they fail**
- [ ] **Step 3: Add schema and migration columns**
- [ ] **Step 4: Update seed data to include node types for existing opname rows**
- [ ] **Step 5: Run Prisma generation and DTO tests again**

### Task 2: Add recursive opname tree read/write services

**Files:**

- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname.controller.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname.service.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname-mutation.service.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname-query.service.ts`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname-tree.helpers.ts`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/dto/opname-tree.dto.ts`
- Test: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname-mutation.service.spec.ts`
- Test: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname-query.service.spec.ts`

**Interfaces:**

- Produces `getTree(query)` and `createChild(parentId, dto, user)`.
- Keeps `create`, `startCounting`, `updateLineCount`, `reconcile`, `close`, and `cancel`.
- Returns recursive nodes from `GET /opname/tree`.

- [ ] **Step 1: Write failing service tests for tree creation and recursive fetch**
- [ ] **Step 2: Run the service tests and confirm they fail**
- [ ] **Step 3: Implement recursive tree helpers and service methods**
- [ ] **Step 4: Wire controller routes for `GET /tree` and `POST /:id/children`**
- [ ] **Step 5: Run backend tests for opname services**

### Task 3: Build the web admin opname tree page

**Files:**

- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse/src/views/opname/OpnameTreePage.vue`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse/src/views/opname/components/OpnameTreeToolbar.vue`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse/src/views/opname/components/OpnameTreeTable.vue`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse/src/views/opname/composables/useOpnameTree.ts`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse/src/services/opname.service.ts`
- Create: `/Users/syillaeltaniadaffa/Documents/Warehouse/src/api/feature/opname.api.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse/src/router/index.ts`

**Interfaces:**

- Produces tree row renderers and create-child actions for `group`, `profile`, and `task`.
- Consumes the backend tree endpoints.
- Replaces the opname transaction list route with the tree page.

- [ ] **Step 1: Write failing page/component tests for recursive rendering**
- [ ] **Step 2: Run the tests and confirm they fail**
- [ ] **Step 3: Implement the tree service and composable**
- [ ] **Step 4: Implement the tree table UI and toolbar**
- [ ] **Step 5: Route `/transactions/opname` to the new page**
- [ ] **Step 6: Run frontend tests for opname tree rendering**

### Task 4: Verify impact and documentation alignment

**Files:**

- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse/docs/spark/specs/2026-07-18-opname-tree-design.md` if implementation forces a clarified detail

**Interfaces:**

- Confirms the shipped implementation matches the approved spec.

- [ ] **Step 1: Run the backend and frontend test subsets for opname**
- [ ] **Step 2: Fix any regressions uncovered by the tests**
- [ ] **Step 3: Review the final diff for scope creep**
- [ ] **Step 4: Commit the implementation work**
