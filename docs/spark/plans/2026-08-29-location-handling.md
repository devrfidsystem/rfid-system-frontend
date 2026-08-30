# Location Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit location type contract and make transaction task location selectors exclude product-type locations while keeping location EPC optional.

**Architecture:** Backend owns the durable `locationType` field and filters location query/options responses. Frontend sends a task-selector filter when loading transaction locations and exposes location type in master-data location records. Existing transaction create flow keeps its current composable/service/API layering.

**Tech Stack:** NestJS 10, Prisma 5, Jest, Vue 3, Vite, Vitest, TypeScript.

## Global Constraints

- Do not change document lifecycle status transitions in this batch.
- Location EPC remains optional and nullable.
- Default existing locations to `storage`.
- Task selectors must exclude `product` locations by requesting `excludeTypes=product`.
- Preserve existing frontend dirty changes unless directly required by this batch.

---

### Task 1: Backend Location Type Contract

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260829090000_add_location_type/migration.sql`
- Modify: `src/modules/warehouse/locations/dto/location.dto.ts`
- Modify: `src/modules/warehouse/locations/locations.service.ts`
- Modify: `src/modules/warehouse/locations/locations.controller.ts`
- Modify: `src/modules/warehouse/locations/locations.service.spec.ts`

**Interfaces:**
- Consumes: `LocationsService.findAll(warehouseId, query)`, `LocationsService.getOptions(warehouseId, search)`
- Produces: `locationType: "storage" | "staging" | "receiving" | "dispatch" | "product"` and optional `excludeTypes`

- [x] **Step 1: Write failing Jest coverage**

Add tests proving `getOptions()` excludes `product` locations when requested and `create()` defaults to `storage`.

- [x] **Step 2: Run backend location tests and confirm RED**

Run: `npm test -- locations.service.spec.ts --runInBand`
Expected: FAIL because `excludeTypes` and `locationType` are not implemented.

- [x] **Step 3: Implement Prisma and service contract**

Add `location_type` to `Location`, migration SQL, DTO validation, create/update persistence, and query filters.

- [x] **Step 4: Run backend location tests and confirm GREEN**

Run: `npm test -- locations.service.spec.ts --runInBand`
Expected: PASS.

### Task 2: Frontend Location DTO And Task Selector Filter

**Files:**
- Modify: `src/model/entities.ts`
- Modify: `src/api/feature/dto/location.dto.ts`
- Modify: `src/views/transactions/composables/useTransactionCreate.ts`
- Modify: `src/views/transactions/composables/useTransactionCreate.test.ts`

**Interfaces:**
- Consumes: `locationService.list({ warehouseId, limit, excludeTypes: ["product"] })`
- Produces: transaction create location selectors that exclude product-type locations.

- [x] **Step 1: Write failing Vitest coverage**

Add a test proving transaction location loading calls `locationService.list()` with `excludeTypes: ["product"]`.

- [x] **Step 2: Run frontend transaction create test and confirm RED**

Run: `npm test -- src/views/transactions/composables/useTransactionCreate.test.ts`
Expected: FAIL because the filter is not sent yet.

- [x] **Step 3: Implement frontend DTO and composable filter**

Add `locationType` to `LocationRecord`, add `excludeTypes` to `LocationListParams`, and request product exclusion in `fetchLocations()`.

- [x] **Step 4: Run frontend transaction create test and confirm GREEN**

Run: `npm test -- src/views/transactions/composables/useTransactionCreate.test.ts`
Expected: PASS.

### Task 3: Master Location Type Field

**Files:**
- Modify: `src/domain/master/entityConfig.ts`
- Modify: `src/api/feature/dto/master.dto.ts`
- Modify: `src/views/master/masterPayload.ts`
- Modify: `src/views/master/entityConfig.test.ts`
- Modify: `src/views/master/masterPayload.test.ts`

**Interfaces:**
- Consumes: backend `locationType`
- Produces: master-data location create/update payloads that can mark a location as `product`.

- [x] **Step 1: Write failing frontend master tests**

Add coverage for the location type form field and payload pass-through.

- [x] **Step 2: Run master tests and confirm RED**

Run: `npm test -- src/views/master/entityConfig.test.ts src/views/master/masterPayload.test.ts`
Expected: FAIL until the field and payload are present.

- [x] **Step 3: Implement location type field**

Add a select field with storage/staging/receiving/dispatch/product options and let payload extraction forward `locationType`.

- [x] **Step 4: Run master tests and confirm GREEN**

Run: `npm test -- src/views/master/entityConfig.test.ts src/views/master/masterPayload.test.ts`
Expected: PASS.

### Task 4: Verification

**Files:**
- Read: `docs/spark/specs/2026-08-29-warehouse-follow-up-notes.md`

- [x] **Step 1: Run focused backend verification**

Run: `npm test -- locations.service.spec.ts --runInBand`
Expected: PASS.

- [x] **Step 2: Run focused frontend verification**

Run: `npm test -- src/views/transactions/composables/useTransactionCreate.test.ts src/views/master/entityConfig.test.ts src/views/master/masterPayload.test.ts`
Expected: PASS.

- [x] **Step 3: Update follow-up notes**

Mark the location-handling points as started/completed for this batch only; leave putaway, outbound, opname, and stock behavior for later batches.
