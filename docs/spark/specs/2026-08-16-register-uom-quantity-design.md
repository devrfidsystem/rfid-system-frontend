# Register Transaction: Product Qty by UOM — Design

- Date: 2026-08-16
- Status: Approved for planning

## Context

The generic transaction create flow (`TransactionCreatePage.vue` → `useTransactionCreate.ts` → `TransactionLineItems.vue`) is shared across all transaction types, including `register`. Today, each line item only has a plain numeric `qty` input alongside the product picker — no unit-of-measure (UOM) context at all.

The user wants: after selecting a product on a `register` line, show that product's quantity broken down by its configured UOM tiers (e.g. "1 Box" / "12 Pcs"), with an "Edit Qty" action that opens a modal where editing one unit's quantity auto-converts the others, before committing back to the line.

Reference: `.docs/FEATURE_MAP.md` (Transactions section), `.docs/BUSINESS_FLOW.md` (Transaction Documents flow).

## Existing data already available (no new fetches needed)

- `useTransactionCreate.ts:97-99` already caches the full `ProductRecord[]` (`productRecords`) fetched via `masterService.fetchList("products")` when the create page loads — this is the same cache `productAttributeSummaries` already reads from.
- `ProductRecord` (`src/model/entities.ts:96-124`) carries:
  - `uom?: { id, name, symbol }` — the product's base UOM (e.g. "Pcs").
  - `unitType?`, `unitName?`, `conversionFactor?` — an optional single breakdown-unit tier (e.g. unitType="carton", unitName="Box", conversionFactor=12).
- These fields are set today via the Product master-data form (`src/domain/master/entityConfig.ts:395-425`) but **are never consumed for any calculation anywhere in the codebase** prior to this feature.

## Conversion semantics (confirmed)

**1 breakdown unit (`unitName`) = `conversionFactor` × base UOM.**

Example: `unitName="Box"`, `conversionFactor=12` → 1 Box = 12 Pcs. If a product has no `unitName`/`conversionFactor` configured, it has only one UOM tier (the base UOM) — no breakdown chip is shown for it.

## Scope

- Applies to the `register` transaction line item UI (`TransactionLineItems.vue`, gated to the `register` transaction key only — other transaction types keep their current plain qty input, since this feature was only requested for register and other types were not scoped by the user).
- The pre-existing "Tag Qty" input + its own Submit button (RFID tag count, a separate downstream step) is **out of scope** — untouched.
- No changes to product master-data (UOM entity config, conversion factor field) — this feature only *consumes* the existing fields.

## UI Design

### Line-item "Product Qty" section

Replaces the current plain qty `Input` for `register` lines only. After `line.productId` is set:

- Renders one read-only qty chip per available UOM tier for that product:
  - Always: base UOM chip (e.g. "12 Pcs").
  - Additionally, if the product has `unitName` + `conversionFactor` configured: breakdown-unit chip (e.g. "1 Box").
- An **"Edit Qty"** button next to the chips opens a modal (using the existing `Drawer`/modal molecule already used elsewhere in this design system, e.g. `DashboardAlertDetailDrawer.vue`'s `Drawer` component).

### Edit Qty modal

- One numeric input per UOM tier available for that product (same 1-or-2 tier structure as the chips).
- Editing either input immediately (reactive `computed`/`watch`, not on submit) recalculates the other tier's value using the conversion factor — e.g. typing "2" in Box recalculates Pcs to 24.
- **Submit** commits the values back to the line and closes the modal; the chip display updates to reflect the new quantity(ies).
- If the product has no breakdown unit, the modal shows only the single base-UOM input (equivalent to today's plain qty input, just presented through the new modal pattern for UI consistency).

## Data & Payload

- The line's existing `qty` field (already part of `useTransactionCreate.ts`'s line shape) remains the source of truth, always stored in **base UOM terms** (e.g. Pcs) — no type change, no schema migration for the line shape itself.
- Two new line fields are added to track what the user actually entered: `enteredUomId` (the UOM tier the user last edited/confirmed — base or breakdown) and `enteredQty` (the quantity in that tier, before conversion).
- The `register` payload builder in `useTransactionCreate.ts` (currently `{ productId, qtyExpected }` per line) is extended to:

```
lines: form.value.lines.map((l) => ({
    productId: l.productId,
    qtyExpected: Number(l.qty),       // base-UOM quantity (existing behavior, unchanged)
    enteredUomId: l.enteredUomId,     // new: which UOM tier the user entered in
    enteredQty: Number(l.enteredQty), // new: the quantity in that entered tier
})),
```

This is additive only — `qtyExpected` keeps its current meaning and value, so this cannot break existing backend processing that only reads `qtyExpected`. `enteredUomId`/`enteredQty` are sent as extra audit-trail context; per the user's confirmation, the backend is not known to reject unrecognized fields, so this is being tried directly rather than gated behind a backend-confirmation step.

## Testing

Following this codebase's established Vitest convention for this exact component (`TransactionLineItems.test.ts` already uses `createSSRApp` + `renderToString` from `vue/server-renderer`, no jsdom/`@vue/test-utils` — the environment is plain Node):

- **Conversion logic** is extracted into a small pure function (e.g. `convertUomQty(baseQty, tier, conversionFactor)`), unit-tested directly and independently of any component rendering — this is the only way to verify the auto-convert-on-edit behavior, since the modal's live-typing interaction can't be driven through SSR string rendering.
- **Chip rendering**: SSR-render tests confirming the correct chip(s) appear for a product with vs. without a breakdown unit configured, after `line.productId` is set.
- **Payload construction**: extends the existing `useTransactionCreate.test.ts` (or creates one if none exists for the `register` payload branch) to assert `qtyExpected`, `enteredUomId`, and `enteredQty` are all present and correctly computed in the submitted payload.
- The Edit Qty modal's live two-way recalculation while open is covered by testing the extracted pure conversion function directly, not by driving the modal's rendered DOM (consistent with this repo's existing SSR-only test environment limitation, already documented in prior i18n migration plans in this repo).

## Out of Scope

- "Tag Qty" input/submit (separate, pre-existing, untouched).
- Other transaction types' line-item qty UI (inbound, outbound, putaway, relocation, transfer, return) — only `register` is in scope per this request.
- Backend/DTO validation changes — `enteredUomId`/`enteredQty` are sent additively; if the backend later needs to formally support/validate them, that's a separate backend-side change outside this frontend repo.
- Multi-level (3+) UOM hierarchies — the data model supports at most 2 tiers (base + one breakdown unit) today; extending beyond that would require a product master-data schema change, which is not part of this request.
