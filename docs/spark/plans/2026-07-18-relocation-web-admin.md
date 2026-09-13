# Relocation Web Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align relocation in web admin with the existing transaction framework, using standard project styling and positioning while keeping the flow shared with mobile.

**Architecture:** Relocation stays on the generic transaction route family and reuses the existing list/create/detail shell already used by register, inbound, putaway, outbound, transfer, return, and opname. The work is mostly content-level: correct labels, correct field visibility, and relocation-specific line editing rules, while preserving shared data-table, card, header, and footer patterns from the project.

**Tech Stack:** Vue 3, TypeScript, Vue Router, shared transaction composables/components, NestJS relocation API already present in backend.

## Global Constraints

- Use the existing transaction route family under `/transactions/relocation`.
- Keep project-standard UI patterns from the existing transaction pages; do not introduce a drawer-based create flow.
- Keep relocation create payload aligned with the current backend DTO contract: `companyId`, `docNumber`, `docDate`, `notes`, and `lines[]` with `productId`, `fromLocationId`, `toLocationId`, and `qty`.
- Keep relocation detail actions limited to draft/post/cancel flow already supported by the transaction service.
- Preserve the shared `Card`, `PageHeader`, `TransactionHeader`, `TransactionTable`, and `TransactionLineItems` components unless a task explicitly needs a targeted adjustment.

---

### Task 1: Standardize relocation list copy and entrypoints

**Files:**

- Modify: `src/views/transactions/composables/useTransactionList.ts`
- Modify: `src/views/transactions/TransactionListPage.vue`
- Test: `src/views/transactions/composables/useTransactionList.test.ts`

**Interfaces:**

- Consumes: `TransactionKey = "relocation"`, shared transaction list table and header components.
- Produces: relocation list page title, tagline, description, and create/view entrypoints that match the existing project layout.

- [x] **Step 1: Write the failing test**

```ts
it("renders relocation list metadata and create entrypoint", () => {
    const list = useTransactionList({ transactionKey: "relocation" });

    expect(list.pageTitle.value).toBe("Relocation Transactions");
    expect(list.pageTagline.value).toBe("Transactions");
    expect(list.sectionHeading.value).toBe("Relocation Transactions");
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/jest src/views/transactions/composables/useTransactionList.test.ts --runInBand`
Expected: FAIL because relocation metadata still reflects generic wording or missing assertions.

- [x] **Step 3: Write minimal implementation**

Update the relocation branch in `useTransactionList.ts` so the page copy matches the wireframe intent but still uses standard project wording:

```ts
if (transactionKey.value === "relocation") {
    return {
        title: "Relocation Transactions",
        description: "See inventory movements between locations (/relocation).",
    };
}
```

Keep the list page route wiring in `TransactionListPage.vue` unchanged unless the test shows a missing create/view path.

- [x] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest src/views/transactions/composables/useTransactionList.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionList.ts src/views/transactions/TransactionListPage.vue src/views/transactions/composables/useTransactionList.test.ts
git commit -m "feat: align relocation list copy"
```

### Task 2: Align relocation create page to the shared transaction form pattern

**Files:**

- Modify: `src/views/transactions/composables/useTransactionCreate.ts`
- Modify: `src/views/transactions/TransactionCreatePage.vue`
- Modify: `src/views/transactions/components/TransactionLineItems.vue`
- Test: `src/views/transactions/composables/useTransactionCreate.test.ts`

**Interfaces:**

- Consumes: `transactionKey === "relocation"`, `transactionService.create("relocation", payload)`, shared location and product option loaders.
- Produces: create page content and relocation line fields that match the wireframe while staying within the existing card/grid layout.

- [x] **Step 1: Write the failing test**

```ts
it("builds a relocation payload with from/to location lines", async () => {
    const create = useTransactionCreate("relocation");
    create.form.value.docNumber = "REL-001";
    create.form.value.warehouseId = "wh-1";
    create.form.value.lines.push({
        productId: "prod-1",
        qty: "3",
        locationId: "",
        fromLocationId: "loc-a",
        toLocationId: "loc-b",
    });

    await create.handleSubmit();

    expect(transactionService.create).toHaveBeenCalledWith("relocation", {
        companyId: "company-1",
        docNumber: "REL-001",
        docDate: expect.any(String),
        notes: undefined,
        lines: [
            {
                productId: "prod-1",
                fromLocationId: "loc-a",
                toLocationId: "loc-b",
                qty: 3,
            },
        ],
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/jest src/views/transactions/composables/useTransactionCreate.test.ts --runInBand`
Expected: FAIL until relocation form copy, field visibility, and payload assertions are matched.

- [x] **Step 3: Write minimal implementation**

Update relocation-specific labels in `useTransactionCreate.ts` and `TransactionCreatePage.vue`:

```ts
const transactionTitle = computed(() =>
    transactionKey === "relocation" ? "Relocation" : transactionKey,
);
const showSingleWarehouse = computed(() =>
    [
        "inbound",
        "putaway",
        "outbound",
        "return",
        "returns",
        "opname",
        "relocation",
    ].includes(transactionKey),
);
```

Keep `TransactionLineItems.vue` showing:

```vue
<Select
    v-model="line.fromLocationId"
    :options="locationOptions"
    label="From Location"
    placeholder="Source location"
    required
/>
<Select
    v-model="line.toLocationId"
    :options="locationOptions"
    label="To Location"
    placeholder="Destination location"
    required
/>
```

for relocation, and keep `qty` mandatory. Do not introduce a drawer or a new page shell.

- [x] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest src/views/transactions/composables/useTransactionCreate.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionCreate.ts src/views/transactions/TransactionCreatePage.vue src/views/transactions/components/TransactionLineItems.vue src/views/transactions/composables/useTransactionCreate.test.ts
git commit -m "feat: align relocation create flow"
```

### Task 3: Align relocation detail page with the standard transaction detail shell

**Files:**

- Modify: `src/views/transactions/composables/useTransactionDetail.ts`
- Modify: `src/views/transactions/TransactionDetailPage.vue`
- Test: `src/views/transactions/composables/useTransactionDetail.test.ts`

**Interfaces:**

- Consumes: relocation detail records from `transactionService.get("relocation", id)`.
- Produces: detail page metadata, header badges, and line rendering that match the shared transaction detail pattern.

- [x] **Step 1: Write the failing test**

```ts
it("renders relocation detail copy and line fields", async () => {
    const detail = useTransactionDetail("relocation", "rel-1");
    await detail.loadTransaction();

    expect(detail.pageTagline.value).toBe("Transaction Detail");
    expect(detail.pageDescription.value).toContain("relocation transaction");
    expect(detail.actionLabel.value).toBe("Transaction");
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/jest src/views/transactions/composables/useTransactionDetail.test.ts --runInBand`
Expected: FAIL until relocation-specific copy is validated.

- [x] **Step 3: Write minimal implementation**

Keep relocation on the shared detail shell and make sure the line table uses the normalized `fromLocationId` and `toLocationId` fields already returned by the backend. Preserve the standard post/cancel actions for draft relocation documents only.

- [x] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest src/views/transactions/composables/useTransactionDetail.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionDetail.ts src/views/transactions/TransactionDetailPage.vue src/views/transactions/composables/useTransactionDetail.test.ts
git commit -m "feat: align relocation detail flow"
```

### Task 4: Verify relocation contract consistency end-to-end

**Files:**

- Modify: `src/services/transactions.service.ts` only if payload normalization is missing
- Modify: `src/views/transactions/types.ts` only if a relocation field is not represented
- Test: `src/services/transactions.service.test.ts`

**Interfaces:**

- Consumes: completed relocation list/create/detail flow.
- Produces: confidence that relocation can be listed, created, and reviewed using the existing transaction architecture without backend contract drift.

- [ ] **Step 1: Write the failing test**

```ts
it("normalizes relocation doc fields without losing origin/destination locations", () => {
    const row = normalizeTransactionRecord({
        relocation_no: "REL-001",
        relocation_date: "2026-07-18T00:00:00.000Z",
        origin_location: { name: "Rack A" },
        destination_location: { name: "Rack B" },
    });

    expect(row.docNo).toBe("REL-001");
    expect(row.date).toBe("2026-07-18T00:00:00.000Z");
    expect(row.sourceLocationId).toBe("Rack A");
    expect(row.destinationLocationId).toBe("Rack B");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/jest src/services/transactions.service.test.ts --runInBand`
Expected: FAIL if relocation normalization or UI wiring is still incomplete.

- [ ] **Step 3: Write minimal implementation**

Patch `transactions.service.ts` normalization only if the test shows relocation data is being dropped or mislabelled.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/jest src/services/transactions.service.test.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/transactions.service.ts src/views/transactions/types.ts src/services/transactions.service.test.ts
git commit -m "feat: verify relocation transaction contract"
```

## Plan Coverage Check

- List page copy and entrypoints: Task 1
- Create page content and relocation line fields: Task 2
- Detail page content and actions: Task 3
- Data normalization and contract consistency: Task 4

## Self-Review Notes

- No placeholder language remains in the plan.
- The plan stays inside the existing transaction architecture and does not add a new relocation shell.
- The plan assumes backend relocation endpoints are already present and only asks for frontend alignment unless tests prove a payload mismatch.
