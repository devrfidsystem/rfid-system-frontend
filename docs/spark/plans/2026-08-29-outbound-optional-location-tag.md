# Outbound Optional Location Tag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make outbound respect optional location tags and lock in that outbound mobile scan completion does not auto-complete the document.

**Architecture:** Backend outbound service keeps warehouse/location validation but no longer requires `Location.epc` for outbound create/post. EPC scan validation remains inside `EpcPostingService` when scan payloads are actually submitted. Frontend outbound detail already renders product/location names and does not use EPC fallback, so this batch does not change UI rendering.

**Tech Stack:** NestJS 10, Prisma 5, Jest, Vue 3, Vite, Vitest, TypeScript.

## Global Constraints

- Do not add an `in_progress` outbound status.
- Do not change outbound `post` status transition: `draft` to `posted`.
- Do not change outbound `complete-scan` status; it must remain `posted`.
- Location tag/EPC is optional for outbound pick locations.
- Keep EPC validation for submitted product EPC scan payloads in `EpcPostingService`.

---

### Task 1: Backend Outbound Allows Untagged Pick Locations

**Files:**
- Modify: `src/modules/warehouse/outbound/outbound.service.spec.ts`
- Modify: `src/modules/warehouse/outbound/outbound.service.ts`

**Interfaces:**
- Consumes: outbound pick locations with `{ id, code, warehouseId, epc?: string | null }`
- Produces: outbound create/post validation that requires same warehouse but not location EPC.

- [x] **Step 1: Write failing Jest coverage**

Change the existing untagged-location test to expect successful outbound creation. Add post coverage that applies stock movement when the pick location has no EPC.

- [x] **Step 2: Run outbound tests and confirm RED**

Run: `npm test -- outbound.service.spec.ts --runInBand`
Expected: FAIL with `Pick location RACK-A has no RFID tag`.

- [x] **Step 3: Implement minimal backend fix**

Replace `assertPickLocationTagged()` with `assertPickLocationInWarehouse()` and remove EPC checks from outbound create/post.

- [x] **Step 4: Run outbound tests and confirm GREEN**

Run: `npm test -- outbound.service.spec.ts --runInBand`
Expected: PASS.

### Task 2: Regression Guard For No Auto Done

**Files:**
- Modify: `src/modules/warehouse/outbound/outbound.service.spec.ts`

**Interfaces:**
- Consumes: `OutboundService.completeMobileScan(id, user, scanDto)`
- Produces: regression coverage that `completeMobileScan()` does not update outbound document status.

- [x] **Step 1: Add regression assertion**

Assert `outboundDoc.update` is not called and returned status remains `posted`.

- [x] **Step 2: Run outbound tests**

Run: `npm test -- outbound.service.spec.ts --runInBand`
Expected: PASS.

### Task 3: Verification And Notes

**Files:**
- Modify: `docs/spark/specs/2026-08-29-warehouse-follow-up-notes.md`
- Modify: `../Warehouse-be/docs/spark/specs/2026-08-29-warehouse-follow-up-notes.md`

- [x] **Step 1: Run backend build**

Run: `npm run build`
Expected: PASS.

- [x] **Step 2: Run frontend outbound detail focused test**

Run: `npm run test:unit -- src/views/transactions/composables/useTransactionDetail.test.ts`
Expected: PASS, confirming outbound detail remains read-only after draft and no UI action enables auto-complete.

- [x] **Step 3: Update follow-up notes**

Mark `Location tag is optional` and `Outbound should not auto done` as implemented/verified for backend outbound.
