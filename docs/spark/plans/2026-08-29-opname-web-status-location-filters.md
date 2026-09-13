# Opname Web Status Location Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Opname web tree and summary can be filtered by status and location through API-backed filters.

**Architecture:** Extend the frontend opname tree params and composable to send `status` and `location` to `/opname/tree` and `/opname/summary`. Extend backend tree and summary query handling so filtered task nodes still return their ancestor group/profile rows for a usable tree.

**Tech Stack:** Vue 3, TypeScript, Vitest, NestJS, Prisma, Jest.

## Global Constraints

- Keep existing local keyword/date filtering in the frontend for this batch.
- Backend location filter accepts a location id, code, or name text through `location`.
- Summary filters only task nodes; tree filters matching nodes and includes their ancestors.

---

### Task 1: API-Backed Opname Status And Location Filters

**Files:**

- Modify: `src/views/opname/composables/useOpnameTree.ts`
- Modify: `src/api/feature/opname.api.ts`
- Modify: `src/views/opname/composables/useOpnameTree.test.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/dto/opname-tree.dto.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname-query.service.ts`
- Modify: `/Users/syillaeltaniadaffa/Documents/Warehouse-be/src/modules/warehouse/opname/opname-query.service.spec.ts`

**Interfaces:**

- Produces FE params: `{ companyId?: string; warehouseId?: string; status?: string; location?: string }`
- Produces BE query DTO fields: `status?: string`, `location?: string`

- [x] **Step 1: Write failing tests**

Run:

- `npm run test:unit -- src/views/opname/composables/useOpnameTree.test.ts`
- `npm test -- opname-query.service.spec.ts --runInBand`

- [x] **Step 2: Implement backend DTO and query filtering**

Add `status` and `location` to `OpnameTreeFilterDto`, use them in `getTree()` and `getSummary()`, and preserve ancestors for filtered trees.

- [x] **Step 3: Implement frontend params and refetch watch**

Send non-empty `statusFilter` and `locationFilter` as API params and reload tree/summary when those filters change.

- [x] **Step 4: Verify focused tests, type-check, and build**

Run:

- `npm run test:unit -- src/views/opname/composables/useOpnameTree.test.ts`
- `npm run type-check`
- `npm test -- opname-query.service.spec.ts --runInBand`
- `npm run build`
