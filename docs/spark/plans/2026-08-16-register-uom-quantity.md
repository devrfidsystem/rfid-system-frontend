# Register Transaction: Product Qty by UOM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** For `register`-transaction line items only, replace the plain qty `Input` with read-only qty chips (base UOM always, breakdown unit — e.g. "Box" — when configured) plus an "Edit Qty" button that opens a `Drawer`-based modal where editing one UOM tier live-recalculates the other via the product's `conversionFactor`, then commits back to the line. The register payload builder is extended (additively) to send the tier/quantity the user actually entered, alongside the existing base-UOM `qtyExpected`.

**Architecture:** A new pure conversion function (`convertUomQty`) lives in `src/views/transactions/utils/uomConversion.ts`, sibling to the existing `transactionStatus.ts` utility. `TransactionLineItems.vue` gains two new props — `isRegister: boolean` (the component currently has **no** knowledge of the transaction type at all; this plan adds the boolean, following the same pattern already used for `isRelocation`, `showDualWarehouse`, etc., all of which are booleans derived in `useTransactionCreate.ts` and passed down from `TransactionCreatePage.vue`) and `productUomInfo: Record<string, ProductUomInfo>` (a per-product UOM lookup, computed in `useTransactionCreate.ts` from the already-cached `productRecords`, following the exact same pattern as the existing `productAttributeSummaries` computed/prop). The line-item shape in `useTransactionCreate.ts` gains `enteredUomId` and `enteredQty` fields; `qty` remains the base-UOM source of truth, mutated directly by the modal's Submit action (the codebase already mutates `line.*` fields directly from child components via `v-model`, so this is consistent with the existing mutation pattern, not a new one).

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vitest (node environment, no jsdom — this component's existing test file uses `createSSRApp` + `renderToString` from `vue/server-renderer`, and this plan follows that exact convention; where the design's own Testing section calls for source-string (`?raw`) assertions instead — because the Edit Qty modal's live-typing interaction cannot be driven through SSR string rendering — this plan uses that convention explicitly, consistent with the same limitation documented in this repo's prior i18n migration plans).

## Global Constraints

(Copied from the approved design spec, `docs/spark/specs/2026-08-16-register-uom-quantity-design.md`)

- Applies to the `register` transaction line item UI (`TransactionLineItems.vue`, gated to the `register` transaction key only — other transaction types keep their current plain qty input, since this feature was only requested for register and other types were not scoped by the user).
- The pre-existing "Tag Qty" input + its own Submit button (RFID tag count, a separate downstream step) is **out of scope** — untouched. (Note: after reading the actual files, no "Tag Qty" input currently exists in `TransactionLineItems.vue` or `useTransactionCreate.ts` — this constraint is preserved verbatim from the design spec in case it refers to a downstream/future screen; nothing in this plan touches any tag-qty concept.)
- No changes to product master-data (UOM entity config, conversion factor field) — this feature only _consumes_ the existing fields.
- 1 breakdown unit (`unitName`) = `conversionFactor` × base UOM. If a product has no `unitName`/`conversionFactor` configured, it has only one UOM tier (the base UOM) — no breakdown chip is shown for it.
- The line's existing `qty` field remains the source of truth, always stored in base UOM terms — no type change, no schema migration for the line shape itself.
- The `register` payload change (`enteredUomId`, `enteredQty` alongside `qtyExpected`) is **additive only** — `qtyExpected` keeps its current meaning and value, so this cannot break existing backend processing that only reads `qtyExpected`.
- Out of scope: "Tag Qty" input/submit; other transaction types' line-item qty UI (inbound, outbound, putaway, relocation, transfer, return); backend/DTO validation changes for `enteredUomId`/`enteredQty`; multi-level (3+) UOM hierarchies.

## Findings from reading the actual files (deviations / decisions from the design spec's summary)

- **`TransactionLineItems.vue` currently receives no transaction-type signal at all** — not even a `transactionKey` string prop. It only receives derived booleans (`isRelocation`, `showDualWarehouse`, `showPutawayLocations`, `showSingleWarehouse`). This plan adds a new `isRegister: boolean` prop, matching that exact existing convention (the composable already computes and returns `isRegister`, and `TransactionCreatePage.vue` already destructures it for its own template `v-if`s — Task 4 below just also passes it down one level to `TransactionLineItems.vue`).
- **`enteredUomId` has no natural "ID" for the breakdown tier.** `ProductRecord.uom` (the base UOM) is a real `UomRecord` with an `id`. The breakdown unit (`unitName` + `conversionFactor`) is **not** backed by any `UomRecord` — it has no id field at all in `ProductRecord`. Since the design spec calls this field `enteredUomId` without specifying what identifies the breakdown tier, this plan uses: `product.uom.id` when the user last entered/confirmed the base tier, and `product.unitType` (falling back to `"breakdown"` if `unitType` is unset) when the user last entered the breakdown tier. This is recorded here explicitly since it's a plan-level decision, not something the design spec pinned down.
- **`useTransactionCreate.test.ts` already exists** (at `src/views/transactions/composables/useTransactionCreate.test.ts`, 261 lines) with payload-construction tests for `relocation`, `outbound`, and validation-blocking tests for `outbound`/`register`, plus tests against `TransactionCreatePage.vue`'s raw source (`pageSource` from `?raw`) for prop-wiring assertions. This plan **extends** that file rather than creating a new one, following its existing mocking setup (`vi.mock` for router/notifier/auth-store/services) and its existing `pageSource` raw-string assertion pattern for page-level wiring checks.
- **`Drawer.vue`'s exact prop API** (from reading the file): `modelValue: boolean`, `title?: string`, `description?: string`, `side?: "right" | "left"`, `width?: "xs" | "sm" | "md" | "lg"`, `closeOnBackdrop?`, `closeOnEsc?`, `persistent?`, `hideClose?`, `objectId?: string`; emits `update:modelValue`, `open`, `close`; has a `#default` slot and an optional `#footer` slot (only rendered if `$slots.footer` is present). This plan uses `model-value`, `title`, `side="right"`, `width="sm"`, `object-id`, the default slot for the qty inputs, and the `#footer` slot for the Submit button.
- **Conversion utility location**: `src/views/transactions/utils/uomConversion.ts`, sibling to the existing `src/views/transactions/utils/transactionStatus.ts` (confirmed convention: small pure-function utility modules per concern, each with its own `<name>.test.ts`).
- **Task-boundary deviation from the suggested 4-task shape**: the `TransactionLineItems.vue` UI change is split into two tasks — Task 2 (read-only qty chips, register-gated) and Task 3 (the Edit Qty modal + live conversion + submit) — because they are two independently testable slices of a large template/script change to the same file, and the modal's tests are necessarily source-string (`?raw`) based (SSR rendering can't exercise typed input/click interactions), while the chip-visibility tests are true SSR-render tests. Keeping them as one task would mix both test styles under one RED/GREEN cycle and make the diff harder to review incrementally. This yields 5 tasks total (utility, chips, modal, composable+page wiring, verification) instead of 4.

---

### Task 1: Add the `convertUomQty` pure conversion utility

**Files:**

- Create: `src/views/transactions/utils/uomConversion.ts`
- Test: `src/views/transactions/utils/uomConversion.test.ts`

**Interfaces:**

- Produces: `convertUomQty(qty: number, fromTier: "base" | "breakdown", conversionFactor: number): number` and the exported `UomQtyTier` type, consumed by Task 3 (`TransactionLineItems.vue`'s chip labels and Edit Qty modal).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { convertUomQty } from "./uomConversion";

describe("convertUomQty", () => {
    it("converts a breakdown-unit qty into base UOM qty", () => {
        expect(convertUomQty(2, "breakdown", 12)).toBe(24);
    });

    it("converts a base UOM qty into breakdown-unit qty", () => {
        expect(convertUomQty(24, "base", 12)).toBe(2);
    });

    it("handles fractional base-to-breakdown conversions", () => {
        expect(convertUomQty(18, "base", 12)).toBe(1.5);
    });

    it("returns 0 when conversionFactor is zero", () => {
        expect(convertUomQty(24, "base", 0)).toBe(0);
    });

    it("returns 0 when conversionFactor is negative", () => {
        expect(convertUomQty(24, "base", -12)).toBe(0);
    });

    it("returns 0 when qty is not a finite number", () => {
        expect(convertUomQty(Number.NaN, "base", 12)).toBe(0);
    });

    it("returns 0 when conversionFactor is not a finite number", () => {
        expect(convertUomQty(24, "base", Number.NaN)).toBe(0);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/utils/uomConversion.test.ts`
Expected: FAIL — `Cannot find module './uomConversion'`

- [ ] **Step 3: Create the conversion utility**

```typescript
export type UomQtyTier = "base" | "breakdown";

/**
 * Converts a quantity between a product's base UOM and its breakdown unit.
 *
 * Conversion semantics: 1 breakdown unit = `conversionFactor` base UOM units
 * (e.g. unitName="Box", conversionFactor=12 -> 1 Box = 12 Pcs).
 *
 * @param qty The quantity expressed in `fromTier`.
 * @param fromTier Which tier `qty` is expressed in ("base" or "breakdown").
 * @param conversionFactor The product's `conversionFactor` (1 breakdown unit
 * = conversionFactor base units). Must be a positive finite number or the
 * result is 0.
 * @returns The equivalent quantity in the other tier, or 0 if `qty` or
 * `conversionFactor` is not a positive/finite usable number.
 */
export function convertUomQty(
    qty: number,
    fromTier: UomQtyTier,
    conversionFactor: number,
): number {
    if (
        !Number.isFinite(qty) ||
        !Number.isFinite(conversionFactor) ||
        conversionFactor <= 0
    ) {
        return 0;
    }

    if (fromTier === "breakdown") {
        return qty * conversionFactor;
    }

    return qty / conversionFactor;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/transactions/utils/uomConversion.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/transactions/utils/uomConversion.ts src/views/transactions/utils/uomConversion.test.ts
git commit -m "feat: add convertUomQty pure conversion utility"
```

---

### Task 2: `TransactionLineItems.vue` — read-only qty chips for register lines

**Files:**

- Modify: `src/views/transactions/components/TransactionLineItems.vue`
- Modify: `src/views/transactions/components/TransactionLineItems.test.ts`

**Interfaces:**

- Adds props: `isRegister: boolean`, `productUomInfo: Record<string, { baseUomId: string; baseLabel: string; unitName?: string | null; conversionFactor?: number | null; breakdownUomId?: string | null }>`.
- Adds line fields to the existing `lines` prop's array item type: `enteredUomId?: string`, `enteredQty?: string` (optional here since this task doesn't write to them yet — Task 3 does).
- Consumes: `convertUomQty` from `src/views/transactions/utils/uomConversion.ts` (Task 1).

Note: at the end of this task, register lines show read-only chips with **no way to edit qty yet** (the Edit Qty button and modal are added in Task 3). This is an intentional intermediate state within this feature branch — the component still type-checks and all of its own tests pass at every step.

- [ ] **Step 1: Write the failing test (extend the existing file)**

Replace the full contents of `src/views/transactions/components/TransactionLineItems.test.ts` with:

```typescript
import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import TransactionLineItems from "./TransactionLineItems.vue";

const baseProps = {
    lines: [
        {
            productId: "prod-1",
            qty: "1",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
        },
    ],
    productOptions: [{ label: "P1 - Widget", value: "prod-1" }],
    productUomInfo: {},
    locationOptions: [],
    fromLocationOptions: [],
    toLocationOptions: [],
    showSingleWarehouse: false,
    isRelocation: false,
    showDualWarehouse: false,
    showPutawayLocations: false,
    isRegister: false,
    submitting: false,
};

describe("TransactionLineItems", () => {
    it("renders the product attribute summary for a line's selected product", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: { "prod-1": "Color: Red, Size: XL" },
        });
        const html = await renderToString(app);
        expect(html).toContain("Color: Red, Size: XL");
    });

    it("renders nothing extra when the selected product has no attribute summary", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
        });
        const html = await renderToString(app);
        expect(html).not.toContain("txt_TransactionLineItemsAttributes_Row0");
    });

    it("still renders the plain quantity input for non-register transaction lines", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: false,
        });
        const html = await renderToString(app);
        expect(html).toContain("nmf_TransactionLineItemsQty_Row0");
        expect(html).not.toContain("chp_TransactionLineItemsBaseQty_Row0");
    });

    it("shows base and breakdown qty chips for a register line with a configured breakdown unit", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
            productUomInfo: {
                "prod-1": {
                    baseUomId: "uom-pcs",
                    baseLabel: "Pcs",
                    unitName: "Box",
                    conversionFactor: 12,
                    breakdownUomId: "carton",
                },
            },
            lines: [
                {
                    productId: "prod-1",
                    qty: "24",
                    locationId: "",
                    fromLocationId: "",
                    toLocationId: "",
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).toContain("chp_TransactionLineItemsBaseQty_Row0");
        expect(html).toContain("24 Pcs");
        expect(html).toContain("chp_TransactionLineItemsBreakdownQty_Row0");
        expect(html).toContain("2 Box");
        expect(html).not.toContain("nmf_TransactionLineItemsQty_Row0");
    });

    it("shows only the base qty chip when the product has no breakdown unit configured", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
            productUomInfo: {
                "prod-1": {
                    baseUomId: "uom-pcs",
                    baseLabel: "Pcs",
                    unitName: null,
                    conversionFactor: null,
                    breakdownUomId: null,
                },
            },
            lines: [
                {
                    productId: "prod-1",
                    qty: "5",
                    locationId: "",
                    fromLocationId: "",
                    toLocationId: "",
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).toContain("chp_TransactionLineItemsBaseQty_Row0");
        expect(html).toContain("5 Pcs");
        expect(html).not.toContain("chp_TransactionLineItemsBreakdownQty_Row0");
    });

    it("prompts for a product before showing any qty chip on a register line", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
            lines: [
                {
                    productId: "",
                    qty: "1",
                    locationId: "",
                    fromLocationId: "",
                    toLocationId: "",
                },
            ],
        });
        const html = await renderToString(app);
        expect(html).not.toContain("chp_TransactionLineItemsBaseQty_Row0");
        expect(html).toContain("Select a product to set quantity.");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/components/TransactionLineItems.test.ts`
Expected: FAIL — `isRegister`/`productUomInfo` props don't exist yet, chip object-ids never render (existing plain-Input-only template), TypeScript errors surface as Vitest failures for the missing props on the component's declared prop types.

- [ ] **Step 3: Migrate `TransactionLineItems.vue`**

Replace the full contents of `src/views/transactions/components/TransactionLineItems.vue` with:

```vue
<template>
    <Card
        class="md:col-span-2 h-full flex flex-col"
        no-padding
        object-id="wdg_TransactionLineItems"
    >
        <div
            class="px-6 py-5 border-b border-border flex justify-between items-center"
        >
            <ToolbarTitle title="Line Items" />
            <Button
                type="button"
                size="sm"
                variant="outline"
                object-id="btn_TransactionLineItemsAdd"
                @click="$emit('add-line')"
                >Add Line</Button
            >
        </div>
        <div class="flex-1 overflow-x-auto p-6 space-y-4">
            <div
                v-for="(line, idx) in lines"
                :key="idx"
                class="flex flex-col xl:flex-row xl:flex-wrap gap-4 xl:items-end border-b border-border xl:border-none pb-6 xl:pb-0 last:border-0"
            >
                <div class="flex-1">
                    <Select
                        v-model="line.productId"
                        :options="productOptions"
                        label="Product"
                        placeholder="Select a product"
                        required
                        :object-id="`cmb_TransactionLineItemsProduct_Row${idx}`"
                    />
                    <p
                        v-if="productAttributeSummaries[line.productId]"
                        class="mt-1 text-xs text-text-secondary"
                        :object-id="`txt_TransactionLineItemsAttributes_Row${idx}`"
                    >
                        {{ productAttributeSummaries[line.productId] }}
                    </p>
                </div>

                <div
                    v-if="
                        showSingleWarehouse &&
                        !isRelocation &&
                        !showPutawayLocations
                    "
                    class="w-full xl:w-48"
                >
                    <Select
                        v-model="line.locationId"
                        :options="locationOptions"
                        label="Location"
                        placeholder="Select location"
                        required
                        :object-id="`cmb_TransactionLineItemsLocation_Row${idx}`"
                    />
                </div>

                <template v-if="showPutawayLocations">
                    <div class="w-full xl:w-48">
                        <Select
                            v-model="line.fromLocationId"
                            :options="locationOptions"
                            label="Source Location"
                            placeholder="Select source location"
                            required
                            :object-id="`cmb_TransactionLineItemsSourceLocation_Row${idx}`"
                        />
                    </div>

                    <div class="w-full xl:w-48">
                        <Select
                            v-model="line.toLocationId"
                            :options="locationOptions"
                            label="Target Location"
                            placeholder="Select target location"
                            required
                            :object-id="`cmb_TransactionLineItemsTargetLocation_Row${idx}`"
                        />
                    </div>
                </template>

                <div
                    v-if="showDualWarehouse || isRelocation"
                    class="w-full xl:w-48"
                >
                    <Select
                        v-model="line.fromLocationId"
                        :options="
                            isRelocation ? locationOptions : fromLocationOptions
                        "
                        label="From Location"
                        placeholder="Source location"
                        required
                        :object-id="`cmb_TransactionLineItemsFromLocation_Row${idx}`"
                    />
                </div>

                <div
                    v-if="showDualWarehouse || isRelocation"
                    class="w-full xl:w-48"
                >
                    <Select
                        v-model="line.toLocationId"
                        :options="
                            isRelocation ? locationOptions : toLocationOptions
                        "
                        label="To Location"
                        placeholder="Destination location"
                        required
                        :object-id="`cmb_TransactionLineItemsToLocation_Row${idx}`"
                    />
                </div>

                <div class="w-full xl:w-48">
                    <template v-if="isRegister">
                        <p class="mb-1 text-xs font-medium text-text-secondary">
                            Product Qty
                        </p>
                        <div
                            v-if="line.productId"
                            class="flex flex-wrap items-center gap-2"
                        >
                            <span
                                class="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text"
                                :object-id="`chp_TransactionLineItemsBaseQty_Row${idx}`"
                            >
                                {{ baseQtyLabel(line) }}
                            </span>
                            <span
                                v-if="hasBreakdownUnit(line.productId)"
                                class="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text"
                                :object-id="`chp_TransactionLineItemsBreakdownQty_Row${idx}`"
                            >
                                {{ breakdownQtyLabel(line) }}
                            </span>
                        </div>
                        <p v-else class="text-xs text-text-secondary">
                            Select a product to set quantity.
                        </p>
                    </template>
                    <Input
                        v-else
                        :id="`qty-${idx}`"
                        v-model="line.qty"
                        label="Quantity"
                        type="number"
                        min="1"
                        required
                        :object-id="`nmf_TransactionLineItemsQty_Row${idx}`"
                    />
                </div>
                <div class="w-full xl:w-auto xl:ml-auto xl:self-end">
                    <Button
                        type="button"
                        variant="outline"
                        class="w-full xl:w-auto text-danger-600 border-danger-200 hover:bg-danger-50 px-3"
                        :object-id="`btn_TransactionLineItemsRemove_Row${idx}`"
                        @click="$emit('remove-line', idx)"
                    >
                        Remove
                    </Button>
                </div>
            </div>
            <p
                v-if="lines.length === 0"
                class="text-sm text-text-secondary text-center py-4"
            >
                No line items added yet. Click "Add Line" to begin.
            </p>
        </div>
        <div
            class="mt-auto px-6 py-3 border-t border-border flex justify-end gap-3"
        >
            <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="submitting"
                object-id="btn_TransactionLineItemsCancel"
                @click="$emit('back')"
                >Cancel</Button
            >
            <Button
                type="submit"
                variant="primary"
                size="sm"
                :disabled="submitting || lines.length === 0"
                object-id="btn_TransactionLineItemsSave"
            >
                {{ submitting ? "Saving..." : "Save Transaction" }}
            </Button>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import { convertUomQty } from "../utils/uomConversion";

interface ProductUomInfo {
    baseUomId: string;
    baseLabel: string;
    unitName?: string | null;
    conversionFactor?: number | null;
    breakdownUomId?: string | null;
}

const props = defineProps<{
    lines: Array<{
        productId: string;
        qty: string;
        locationId: string;
        fromLocationId: string;
        toLocationId: string;
        enteredUomId?: string;
        enteredQty?: string;
    }>;
    productOptions: Array<{ label: string; value: string }>;
    productAttributeSummaries: Record<string, string>;
    productUomInfo: Record<string, ProductUomInfo>;
    locationOptions: Array<{ label: string; value: string }>;
    fromLocationOptions: Array<{ label: string; value: string }>;
    toLocationOptions: Array<{ label: string; value: string }>;
    showSingleWarehouse: boolean;
    isRelocation: boolean;
    showDualWarehouse: boolean;
    showPutawayLocations: boolean;
    isRegister: boolean;
    submitting: boolean;
}>();

defineEmits(["add-line", "remove-line", "back"]);

const hasBreakdownUnit = (productId: string): boolean => {
    const info = props.productUomInfo[productId];
    return Boolean(info?.unitName && info?.conversionFactor);
};

const formatQtyNumber = (value: number): string => {
    if (!Number.isFinite(value)) return "0";
    return Number(value.toFixed(2)).toString();
};

const baseQtyLabel = (line: { productId: string; qty: string }): string => {
    const info = props.productUomInfo[line.productId];
    const label = info?.baseLabel ?? "Unit";
    return `${line.qty || "0"} ${label}`;
};

const breakdownQtyLabel = (line: {
    productId: string;
    qty: string;
}): string => {
    const info = props.productUomInfo[line.productId];
    if (!info?.conversionFactor || !info?.unitName) return "";
    const breakdownQty = convertUomQty(
        Number(line.qty) || 0,
        "base",
        info.conversionFactor,
    );
    return `${formatQtyNumber(breakdownQty)} ${info.unitName}`;
};
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/transactions/components/TransactionLineItems.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors. Note: `TransactionCreatePage.vue` does not yet pass `is-register`/`product-uom-info` to `TransactionLineItems` — since both are now required props with no `?`, this will surface as a type-check error at the `TransactionCreatePage.vue` call site until Task 4 wires them up. If `npm run type-check` fails only at that one call site with a "missing required props" error, that is expected and acceptable at this intermediate step; it is fully resolved by Task 4. If it fails anywhere else, treat that as a real regression to fix before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/views/transactions/components/TransactionLineItems.vue src/views/transactions/components/TransactionLineItems.test.ts
git commit -m "feat: show read-only base/breakdown qty chips for register lines"
```

---

### Task 3: `TransactionLineItems.vue` — Edit Qty modal with live conversion

**Files:**

- Modify: `src/views/transactions/components/TransactionLineItems.vue`
- Modify: `src/views/transactions/components/TransactionLineItems.test.ts`

**Interfaces:**

- Consumes: `Drawer` (`src/components/organisms/Drawer.vue`), `convertUomQty` (Task 1).
- Writes to: `line.qty`, `line.enteredUomId`, `line.enteredQty` on submit (the line objects the `lines` prop's array items — mutated directly, matching this component's existing pattern of mutating `line.locationId` etc. via `v-model`).

- [ ] **Step 1: Write the failing test (extend the existing file, append to the same `describe` block)**

Add these test cases to `src/views/transactions/components/TransactionLineItems.test.ts`, plus a new import at the top of the file:

```typescript
import transactionLineItemsSource from "./TransactionLineItems.vue?raw";
```

Append inside the existing `describe("TransactionLineItems", ...)` block (after the last test from Task 2):

```typescript
    it("renders an Edit Qty button next to the chips for a register line with a product selected", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
            productUomInfo: {
                "prod-1": {
                    baseUomId: "uom-pcs",
                    baseLabel: "Pcs",
                    unitName: "Box",
                    conversionFactor: 12,
                    breakdownUomId: "carton",
                },
            },
        });
        const html = await renderToString(app);
        expect(html).toContain("btn_TransactionLineItemsEditQty_Row0");
        expect(html).toContain("Edit Qty");
    });

    it("does not render the Edit Qty modal contents by default (closed state)", async () => {
        const app = createSSRApp(TransactionLineItems, {
            ...baseProps,
            productAttributeSummaries: {},
            isRegister: true,
        });
        const html = await renderToString(app);
        expect(html).not.toContain("nmf_TransactionLineItemsEditQtyBase");
        expect(html).not.toContain("nmf_TransactionLineItemsEditQtyBreakdown");
        expect(html).not.toContain("btn_TransactionLineItemsEditQtySubmit");
    });
});

describe("TransactionLineItems Edit Qty modal wiring (source)", () => {
    it("uses the Drawer molecule for the Edit Qty modal", () => {
        expect(transactionLineItemsSource).toContain(
            'import Drawer from "@/components/organisms/Drawer.vue"',
        );
        expect(transactionLineItemsSource).toContain("<Drawer");
        expect(transactionLineItemsSource).toContain(
            'object-id="drw_TransactionLineItemsEditQty"',
        );
    });

    it("opens the modal for the clicked line's index via openEditQty", () => {
        expect(transactionLineItemsSource).toContain(
            '@click="openEditQty(idx)"',
        );
        expect(transactionLineItemsSource).toContain(
            "const editQtyLineIndex = ref<number | null>(null);",
        );
    });

    it("recalculates the other tier live via convertUomQty on each input", () => {
        expect(transactionLineItemsSource).toContain("onEditBaseInput");
        expect(transactionLineItemsSource).toContain("onEditBreakdownInput");
        expect(transactionLineItemsSource).toContain(
            'convertUomQty(n, "base", factor)',
        );
        expect(transactionLineItemsSource).toContain(
            'convertUomQty(n, "breakdown", factor)',
        );
    });

    it("commits both the base qty and the entered-tier fields back to the line on submit", () => {
        expect(transactionLineItemsSource).toContain("const submitEditQty");
        expect(transactionLineItemsSource).toContain(
            "line.qty = editQtyBaseInput.value",
        );
        expect(transactionLineItemsSource).toContain("line.enteredUomId");
        expect(transactionLineItemsSource).toContain("line.enteredQty");
    });
});
```

(This closes out the pre-existing `describe("TransactionLineItems", ...)` block from Task 2 and adds a second, sibling `describe` block for the modal-wiring source checks — the file has two top-level `describe` blocks after this step.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/components/TransactionLineItems.test.ts`
Expected: FAIL — no Edit Qty button, no `Drawer` usage, no `openEditQty`/`onEditBaseInput`/`onEditBreakdownInput`/`submitEditQty` in the source yet.

- [ ] **Step 3: Migrate `TransactionLineItems.vue`**

In the template, replace the register-chip block's inner `<div v-if="line.productId" ...>` (added in Task 2) with a version that also includes the Edit Qty button:

```vue
                        <div
                            v-if="line.productId"
                            class="flex flex-wrap items-center gap-2"
                        >
                            <span
                                class="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text"
                                :object-id="`chp_TransactionLineItemsBaseQty_Row${idx}`"
                            >
                                {{ baseQtyLabel(line) }}
                            </span>
                            <span
                                v-if="hasBreakdownUnit(line.productId)"
                                class="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text"
                                :object-id="`chp_TransactionLineItemsBreakdownQty_Row${idx}`"
                            >
                                {{ breakdownQtyLabel(line) }}
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                :object-id="`btn_TransactionLineItemsEditQty_Row${idx}`"
                                @click="openEditQty(idx)"
                            >
                                Edit Qty
                            </Button>
                        </div>
```

Add the Edit Qty `Drawer` as a sibling right after the closing `</div>` of `<div class="flex-1 overflow-x-auto p-6 space-y-4">` (i.e. right before the footer `<div class="mt-auto ...">`), still inside `<Card>`:

```vue
        <Drawer
            :model-value="editQtyLineIndex !== null"
            title="Edit Quantity"
            side="right"
            width="sm"
            object-id="drw_TransactionLineItemsEditQty"
            @update:model-value="(open) => !open && closeEditQty()"
        >
            <div v-if="editQtyLineIndex !== null" class="space-y-4">
                <Input
                    id="editQtyBase"
                    :model-value="editQtyBaseInput"
                    :label="`Quantity (${editQtyBaseLabel})`"
                    type="number"
                    min="0"
                    object-id="nmf_TransactionLineItemsEditQtyBase"
                    @update:model-value="onEditBaseInput"
                />
                <Input
                    v-if="editQtyHasBreakdown"
                    id="editQtyBreakdown"
                    :model-value="editQtyBreakdownInput"
                    :label="`Quantity (${editQtyUnitName})`"
                    type="number"
                    min="0"
                    object-id="nmf_TransactionLineItemsEditQtyBreakdown"
                    @update:model-value="onEditBreakdownInput"
                />
            </div>
            <template #footer>
                <Button
                    type="button"
                    variant="primary"
                    class="w-full justify-center"
                    object-id="btn_TransactionLineItemsEditQtySubmit"
                    @click="submitEditQty"
                >
                    Submit
                </Button>
            </template>
        </Drawer>
```

Update the `<script setup>` block: add the `Drawer` import and `ref`/`computed` imports, plus the modal state and handlers:

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import { convertUomQty } from "../utils/uomConversion";

interface ProductUomInfo {
    baseUomId: string;
    baseLabel: string;
    unitName?: string | null;
    conversionFactor?: number | null;
    breakdownUomId?: string | null;
}

const props = defineProps<{
    lines: Array<{
        productId: string;
        qty: string;
        locationId: string;
        fromLocationId: string;
        toLocationId: string;
        enteredUomId?: string;
        enteredQty?: string;
    }>;
    productOptions: Array<{ label: string; value: string }>;
    productAttributeSummaries: Record<string, string>;
    productUomInfo: Record<string, ProductUomInfo>;
    locationOptions: Array<{ label: string; value: string }>;
    fromLocationOptions: Array<{ label: string; value: string }>;
    toLocationOptions: Array<{ label: string; value: string }>;
    showSingleWarehouse: boolean;
    isRelocation: boolean;
    showDualWarehouse: boolean;
    showPutawayLocations: boolean;
    isRegister: boolean;
    submitting: boolean;
}>();

defineEmits(["add-line", "remove-line", "back"]);

const hasBreakdownUnit = (productId: string): boolean => {
    const info = props.productUomInfo[productId];
    return Boolean(info?.unitName && info?.conversionFactor);
};

const formatQtyNumber = (value: number): string => {
    if (!Number.isFinite(value)) return "0";
    return Number(value.toFixed(2)).toString();
};

const baseQtyLabel = (line: { productId: string; qty: string }): string => {
    const info = props.productUomInfo[line.productId];
    const label = info?.baseLabel ?? "Unit";
    return `${line.qty || "0"} ${label}`;
};

const breakdownQtyLabel = (line: {
    productId: string;
    qty: string;
}): string => {
    const info = props.productUomInfo[line.productId];
    if (!info?.conversionFactor || !info?.unitName) return "";
    const breakdownQty = convertUomQty(
        Number(line.qty) || 0,
        "base",
        info.conversionFactor,
    );
    return `${formatQtyNumber(breakdownQty)} ${info.unitName}`;
};

const editQtyLineIndex = ref<number | null>(null);
const editQtyBaseInput = ref("");
const editQtyBreakdownInput = ref("");
const editQtyLastTier = ref<"base" | "breakdown">("base");

const editQtyProductInfo = computed<ProductUomInfo | null>(() => {
    if (editQtyLineIndex.value === null) return null;
    const line = props.lines[editQtyLineIndex.value];
    return props.productUomInfo[line.productId] ?? null;
});

const editQtyHasBreakdown = computed(() =>
    Boolean(
        editQtyProductInfo.value?.unitName &&
            editQtyProductInfo.value?.conversionFactor,
    ),
);

const editQtyConversionFactor = computed(
    () => editQtyProductInfo.value?.conversionFactor ?? 0,
);

const editQtyBaseLabel = computed(
    () => editQtyProductInfo.value?.baseLabel ?? "Unit",
);

const editQtyUnitName = computed(
    () => editQtyProductInfo.value?.unitName ?? "",
);

const openEditQty = (idx: number) => {
    editQtyLineIndex.value = idx;
    const line = props.lines[idx];
    editQtyBaseInput.value = line.qty || "0";
    editQtyLastTier.value = "base";

    const factor = props.productUomInfo[line.productId]?.conversionFactor;
    if (factor) {
        const baseValue = Number(line.qty) || 0;
        editQtyBreakdownInput.value = formatQtyNumber(
            convertUomQty(baseValue, "base", factor),
        );
    } else {
        editQtyBreakdownInput.value = "";
    }
};

const closeEditQty = () => {
    editQtyLineIndex.value = null;
};

const onEditBaseInput = (value: string) => {
    editQtyBaseInput.value = value;
    editQtyLastTier.value = "base";
    const factor = editQtyConversionFactor.value;
    if (!factor) return;
    const n = Number(value);
    editQtyBreakdownInput.value = Number.isFinite(n)
        ? formatQtyNumber(convertUomQty(n, "base", factor))
        : "";
};

const onEditBreakdownInput = (value: string) => {
    editQtyBreakdownInput.value = value;
    editQtyLastTier.value = "breakdown";
    const factor = editQtyConversionFactor.value;
    if (!factor) return;
    const n = Number(value);
    editQtyBaseInput.value = Number.isFinite(n)
        ? formatQtyNumber(convertUomQty(n, "breakdown", factor))
        : "";
};

const submitEditQty = () => {
    if (editQtyLineIndex.value === null) return;
    const line = props.lines[editQtyLineIndex.value];
    const info = editQtyProductInfo.value;

    line.qty = editQtyBaseInput.value || "0";

    if (editQtyLastTier.value === "breakdown" && editQtyHasBreakdown.value) {
        line.enteredUomId = info?.breakdownUomId ?? "breakdown";
        line.enteredQty = editQtyBreakdownInput.value || "0";
    } else {
        line.enteredUomId = info?.baseUomId ?? "";
        line.enteredQty = editQtyBaseInput.value || "0";
    }

    closeEditQty();
};
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/transactions/components/TransactionLineItems.test.ts`
Expected: PASS (10 tests: 8 in the first `describe` block, 4 in the second)

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: no errors, other than the same pre-existing `TransactionCreatePage.vue` missing-props error noted in Task 2 Step 5 (still resolved by Task 4).

- [ ] **Step 6: Commit**

```bash
git add src/views/transactions/components/TransactionLineItems.vue src/views/transactions/components/TransactionLineItems.test.ts
git commit -m "feat: add Edit Qty modal with live base/breakdown conversion"
```

---

### Task 4: `useTransactionCreate.ts` line-shape + register payload + `TransactionCreatePage.vue` wiring

**Files:**

- Modify: `src/views/transactions/composables/useTransactionCreate.ts`
- Modify: `src/views/transactions/TransactionCreatePage.vue`
- Modify: `src/views/transactions/composables/useTransactionCreate.test.ts`

**Interfaces:**

- Extends the `lines` array item type in `form.value.lines` with `enteredUomId: string` and `enteredQty: string` (both default to `""` in `addLine`).
- Produces: `productUomInfo` computed (`Record<string, ProductUomInfo>`), returned from `useTransactionCreate`, consumed by `TransactionCreatePage.vue` and passed to `TransactionLineItems.vue`'s `product-uom-info` prop (Tasks 2–3).
- Extends the `register` case of the payload switch to include `enteredUomId` and `enteredQty` per line, additive to the existing `qtyExpected`.
- `TransactionCreatePage.vue` passes `:is-register="isRegister"` (already computed and already destructured in this file — just not yet passed down) and `:product-uom-info="productUomInfo"` to `TransactionLineItems`.

- [ ] **Step 1: Write the failing tests (extend the existing file)**

Append these test cases inside the existing `describe("useTransactionCreate", ...)` block in `src/views/transactions/composables/useTransactionCreate.test.ts` (after the last existing test, before the closing `});`):

```typescript

    it("adds a new line with empty enteredUomId and enteredQty defaults", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.addLine();

        expect(create.form.value.lines[0]).toMatchObject({
            enteredUomId: "",
            enteredQty: "",
        });
    });

    it("builds a register payload including entered UOM tier and quantity", async () => {
        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");

        create.form.value.docNumber = "REG-001";
        create.form.value.transactionDate = "2026-07-18";
        create.form.value.registeredById = "user-7";
        create.form.value.warehouseId = "warehouse-1";
        create.form.value.locationId = "location-1";
        create.form.value.lines.push({
            productId: "prod-1",
            qty: "24",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "carton",
            enteredQty: "2",
        });

        await create.handleSubmit();

        expect(mocks.createSpy).toHaveBeenCalledWith("register", {
            companyId: "company-1",
            docNumber: "REG-001",
            docDate: expect.any(String),
            registeredById: "user-7",
            warehouseId: "warehouse-1",
            locationId: "location-1",
            lines: [
                {
                    productId: "prod-1",
                    qtyExpected: 24,
                    enteredUomId: "carton",
                    enteredQty: 2,
                },
            ],
        });
        expect(mocks.notifySuccessSpy).toHaveBeenCalledWith(
            "Transaction created successfully",
        );
        expect(mocks.pushSpy).toHaveBeenCalledWith("/transactions/register");
    });

    it("builds a product-id-keyed UOM info map after loading options", async () => {
        const { masterService } = await import("@/services/master.service");
        vi.mocked(masterService.fetchList).mockImplementation(
            (entity: string) => {
                if (entity === "products") {
                    return Promise.resolve({
                        items: [
                            {
                                id: "prod-1",
                                code: "P1",
                                name: "Widget",
                                createdAt: "2026-01-01",
                                uom: {
                                    id: "uom-pcs",
                                    name: "Pieces",
                                    symbol: "Pcs",
                                },
                                unitType: "carton",
                                unitName: "Box",
                                conversionFactor: 12,
                            },
                            {
                                id: "prod-2",
                                code: "P2",
                                name: "Gadget",
                                createdAt: "2026-01-01",
                                uom: {
                                    id: "uom-pcs",
                                    name: "Pieces",
                                    symbol: "Pcs",
                                },
                            },
                        ],
                        meta: null,
                    });
                }
                return Promise.resolve({ items: [], meta: null });
            },
        );

        const { useTransactionCreate } = await import("./useTransactionCreate");
        const create = useTransactionCreate("register");
        await create.loadOptions();

        expect(create.productUomInfo.value).toEqual({
            "prod-1": {
                baseUomId: "uom-pcs",
                baseLabel: "Pcs",
                unitName: "Box",
                conversionFactor: 12,
                breakdownUomId: "carton",
            },
            "prod-2": {
                baseUomId: "uom-pcs",
                baseLabel: "Pcs",
                unitName: null,
                conversionFactor: null,
                breakdownUomId: null,
            },
        });
    });

    it("wires isRegister and product UOM info into the line items component", () => {
        expect(pageSource).toContain(':is-register="isRegister"');
        expect(pageSource).toContain(':product-uom-info="productUomInfo"');
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/transactions/composables/useTransactionCreate.test.ts`
Expected: FAIL — `enteredUomId`/`enteredQty` not defaulted in `addLine`, register payload doesn't include them, `create.productUomInfo` doesn't exist, `pageSource` doesn't contain the new prop bindings.

- [ ] **Step 3: Extend the line shape and `addLine` in `useTransactionCreate.ts`**

Update the `form` ref's `lines` type (near the top of the function):

```typescript
    const form = ref({
        docNumber: `TRX-${Date.now()}`,
        transactionDate: new Date().toISOString().split("T")[0],
        title: "",
        period: "",
        warehouseId: "",
        locationId: "",
        fromWarehouseId: "",
        toWarehouseId: "",
        partnerId: "",
        assignedById: "",
        deadlineAt: "",
        registeredById: "",
        referenceType: "",
        referenceId: "",
        notes: "",
        lines: [] as {
            productId: string;
            qty: string;
            locationId: string;
            fromLocationId: string;
            toLocationId: string;
            enteredUomId: string;
            enteredQty: string;
        }[],
    });
```

Update `addLine`:

```typescript
    const addLine = () => {
        form.value.lines.push({
            productId: "",
            qty: "1",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
            enteredUomId: "",
            enteredQty: "",
        });
    };
```

- [ ] **Step 4: Add the `ProductUomInfo` type and `productUomInfo` computed**

Add near the top of the file, alongside the other imports:

```typescript
export interface ProductUomInfo {
    baseUomId: string;
    baseLabel: string;
    unitName?: string | null;
    conversionFactor?: number | null;
    breakdownUomId?: string | null;
}
```

Add the computed right after the existing `productAttributeSummaries` computed:

```typescript
    const productUomInfo = computed<Record<string, ProductUomInfo>>(() => {
        const map: Record<string, ProductUomInfo> = {};
        productRecords.value.forEach((product) => {
            map[String(product.id)] = {
                baseUomId: product.uom?.id ?? "",
                baseLabel: product.uom?.symbol || product.uom?.name || "Unit",
                unitName: product.unitName ?? null,
                conversionFactor: product.conversionFactor ?? null,
                breakdownUomId: product.unitType ?? null,
            };
        });
        return map;
    });
```

- [ ] **Step 5: Extend the `register` payload builder**

Replace the `case "register":` block:

```typescript
                case "register":
                    finalPayload = {
                        ...basePayload,
                        docDate: docDateStr,
                        registeredById: form.value.registeredById,
                        warehouseId: form.value.warehouseId,
                        locationId: form.value.locationId,
                        lines: form.value.lines.map((l) => ({
                            productId: l.productId,
                            qtyExpected: Number(l.qty),
                            enteredUomId: l.enteredUomId,
                            enteredQty: Number(l.enteredQty),
                        })),
                    };
                    break;
```

- [ ] **Step 6: Return `productUomInfo` from the composable**

Update the `return { ... }` block at the end of the function to add `productUomInfo` alongside `productAttributeSummaries`:

```typescript
    return {
        form,
        submitting,
        transactionTitle,
        showSingleWarehouse,
        showDualWarehouse,
        showPartnerField,
        isTransfer,
        isRelocation,
        isOpname,
        isRegister,
        isOutbound,
        isPutaway,
        partnerLabel,
        warehouseOptions,
        partnerOptions,
        productOptions,
        productAttributeSummaries,
        productUomInfo,
        userOptions,
        locationOptions,
        fromLocationOptions,
        toLocationOptions,
        showPutawayLocations,
        opnameProfileOptions,
        quartalOptions,
        monthOptions,
        addLine,
        removeLine,
        handleBack,
        loadOptions,
        handleSubmit,
    };
```

- [ ] **Step 7: Wire `isRegister` and `productUomInfo` into `TransactionCreatePage.vue`**

In the `<script setup>` block, add `productUomInfo` to the destructured composable result:

```typescript
const {
    form,
    submitting,
    transactionTitle,
    showSingleWarehouse,
    showDualWarehouse,
    showPutawayLocations,
    showPartnerField,
    isRelocation,
    isOpname,
    isRegister,
    isOutbound,
    isPutaway,
    partnerLabel,
    warehouseOptions,
    partnerOptions,
    productOptions,
    productAttributeSummaries,
    productUomInfo,
    userOptions,
    locationOptions,
    fromLocationOptions,
    toLocationOptions,
    opnameProfileOptions,
    quartalOptions,
    monthOptions,
    addLine,
    removeLine,
    handleBack,
    loadOptions,
    handleSubmit,
} = useTransactionCreate(props.transactionKey);
```

In the template, update the `<TransactionLineItems>` usage to pass the two new props:

```vue
                <!-- Line Items Form (Hide for Opname only) -->
                <TransactionLineItems
                    v-if="!isOpname"
                    :lines="form.lines"
                    :product-options="productOptions"
                    :product-attribute-summaries="productAttributeSummaries"
                    :product-uom-info="productUomInfo"
                    :location-options="locationOptions"
                    :from-location-options="fromLocationOptions"
                    :to-location-options="toLocationOptions"
                    :show-single-warehouse="showSingleWarehouse && !isRegister"
                    :is-relocation="isRelocation"
                    :show-dual-warehouse="showDualWarehouse"
                    :show-putaway-locations="showPutawayLocations"
                    :is-register="isRegister"
                    :submitting="submitting"
                    @add-line="addLine"
                    @remove-line="removeLine"
                    @back="handleBack"
                />
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/views/transactions/composables/useTransactionCreate.test.ts`
Expected: PASS (all tests in the file, including the pre-existing `relocation`/`outbound`/validation tests, which are unaffected)

Run: `npx vitest run src/views/transactions/components/TransactionLineItems.test.ts`
Expected: PASS (all 10 tests — these were passing on their own props already, but this confirms nothing regressed)

- [ ] **Step 9: Type-check**

Run: `npm run type-check`
Expected: no errors. This resolves the intermediate "missing required props" note from Tasks 2–3.

- [ ] **Step 10: Commit**

```bash
git add src/views/transactions/composables/useTransactionCreate.ts src/views/transactions/TransactionCreatePage.vue src/views/transactions/composables/useTransactionCreate.test.ts
git commit -m "feat: extend register line shape and payload with entered UOM tier/qty"
```

---

### Task 5: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Type-check the whole project**

Run: `npm run type-check`
Expected: no errors.

- [ ] **Step 2: Run the full unit test suite**

Run: `npm run test:unit`
Expected: all tests pass, including every test file touched or extended in Tasks 1–4 (`uomConversion.test.ts`, `TransactionLineItems.test.ts`, `useTransactionCreate.test.ts`) and every pre-existing test elsewhere in the repo (no regressions).

- [ ] **Step 3: Build the project**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Self-review against the design spec**

Confirm each design-spec requirement is covered:

- Conversion utility extracted and unit-tested independent of rendering — Task 1.
- Register-only gating via `isRegister` prop, other transaction types keep the plain `Input` — Task 2 (chip block gated `v-if="isRegister"` / `v-else` on the original `Input`), verified by the "still renders the plain quantity input for non-register transaction lines" test.
- Base UOM chip always shown, breakdown chip only when `unitName` + `conversionFactor` both present — Task 2.
- Edit Qty button + `Drawer`-based modal, one input per available tier, live recalculation via `convertUomQty`, Submit commits and closes — Task 3.
- Line shape gains `enteredUomId`/`enteredQty` alongside unchanged `qty` — Task 4 Step 3.
- Register payload additively includes `enteredUomId`/`enteredQty` alongside unchanged `qtyExpected` — Task 4 Step 5, verified by the payload-construction test.
- No changes to product master-data / UOM entity config — confirmed: no file under `src/domain/master/` or any UOM entity-config file is touched anywhere in this plan.
- "Tag Qty" input untouched — confirmed: no such input exists in the touched files; nothing resembling it was added or removed.
- Other transaction types' qty UI untouched — confirmed: the `v-else` branch in Task 2 preserves the exact original `Input` markup and object-id (`nmf_TransactionLineItemsQty_Row${idx}`) byte-for-byte.

- [ ] **Step 5: Scan for placeholder red flags**

Confirm no task above contains "similar to X", "add appropriate handling", `// TODO`, or any other placeholder — every code block in Tasks 1–4 is complete, literal, and copy-pasteable.

- [ ] **Step 6: Commit (only if Steps 1–3 required any fix-up changes; otherwise nothing to commit)**

```bash
git status
```

If clean (no changes beyond what Tasks 1–4 already committed), no commit is needed here — this task is verification-only. If any fix-up was required to make type-check/test/build pass, stage and commit it with a message describing the fix, e.g.:

```bash
git add -A
git commit -m "fix: resolve type-check/build issues found during verification pass"
```
