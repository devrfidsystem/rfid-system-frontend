# Outbound Web Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use spark:subagent-driven-development (recommended) or spark:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align outbound web admin and backend behavior with the outbound wireframe while keeping the shared transaction architecture and letting mobile own operational status progress.

**Architecture:** Outbound stays inside the existing transaction route family and reuses the current list/create/detail pages. The web app gets outbound-specific copy, fields, and read-only detail rendering, while the backend grows a document state machine and line-level execution endpoints that mobile can drive. Status and assignment fields are normalized once in the shared service layer so list/detail pages stay simple.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Vitest, NestJS, Prisma, Jest, class-validator, Swagger

## Global Constraints

- outbound stays on the shared transaction route family.
- web admin can create outbound drafts and review them.
- mobile can execute outbound progress from the same backend documents.
- status values support `partial`, `dispatched`, and `done`.
- admin UI does not manually advance mobile execution states.
- outbound list, create, detail pages match the project’s standard layout.

---

### Task 1: Standardize outbound list copy, columns, and normalization

**Files:**

- Modify: `src/views/transactions/composables/useTransactionList.ts`
- Modify: `src/views/transactions/TransactionListPage.vue`
- Modify: `src/views/report/reportConfig.ts`
- Modify: `src/services/transactions.service.ts`
- Test: `src/views/transactions/composables/useTransactionList.test.ts`

**Interfaces:**

- Consumes: `TransactionKey = "outbound"`, shared transaction table/header shell, outbound backend rows that include assignment metadata.
- Produces: outbound list title/description, outbound table columns, and normalized row fields for assignment and deadline display.

- [ ] **Step 1: Write the failing test**

```ts
it("renders outbound list metadata and create entrypoint", async () => {
    const { useTransactionList } = await import("./useTransactionList");
    const list = useTransactionList({ transactionKey: "outbound" });

    expect(list.pageTitle.value).toBe("Outbound Assignment");
    expect(list.pageTagline.value).toBe("Tasks");
    expect(list.sectionHeading.value).toBe("Outbound Assignment");
    expect(list.canCreate.value).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/views/transactions/composables/useTransactionList.test.ts`
Expected: FAIL until outbound list copy, columns, and normalization are aligned.

- [ ] **Step 3: Write minimal implementation**

Update outbound list metadata and row normalization so the shared shell can render the wireframe columns:

```ts
const transactionTitles = {
    outbound: {
        title: "Outbound Assignment",
        description:
            "Manage outbound tasks and execution progress from /outbound.",
    },
};

const pageTagline = computed(() => {
    if (transactionKey.value === "outbound") return "Tasks";
    return "Transactions";
});

mapped.assignedBy =
    (row.assignedBy as Record<string, unknown>)?.fullName ??
    row.assigned_by ??
    row.assignedById ??
    row.assignedBy;
mapped.deadlineAt = row.deadlineAt ?? row.deadline_at ?? row.deadline;
mapped.type = row.type ?? row.docType ?? row.transactionType ?? "Outbound";
```

Also update `reportConfigs.outbound.columns` to render the wireframe shape:

```ts
columns: [
    { key: "docNo", label: "ID Number" },
    { key: "type", label: "Type" },
    { key: "assignedBy.fullName", label: "Assigned User" },
    { key: "deadlineAt", label: "Deadline" },
    { key: "status", label: "Status" },
],
```

Keep `TransactionHeader` unchanged unless the outbound button copy needs a direct label adjustment.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/views/transactions/composables/useTransactionList.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionList.ts src/views/transactions/TransactionListPage.vue src/views/report/reportConfig.ts src/services/transactions.service.ts src/views/transactions/composables/useTransactionList.test.ts
git commit -m "feat: align outbound list shell"
```

### Task 2: Align outbound create page with assignment metadata and payload

**Files:**

- Modify: `src/views/transactions/composables/useTransactionCreate.ts`
- Modify: `src/views/transactions/TransactionCreatePage.vue`
- Modify: `src/views/transactions/components/TransactionLineItems.vue`
- Test: `src/views/transactions/composables/useTransactionCreate.test.ts`

**Interfaces:**

- Consumes: `transactionKey === "outbound"`, shared user list loader, line-item editor, and backend create payload contract.
- Produces: outbound create form fields for assignment metadata and a payload that includes assignment and deadline fields.

- [ ] **Step 1: Write the failing test**

```ts
it("builds an outbound payload with assignment metadata and lines", async () => {
    const { useTransactionCreate } = await import("./useTransactionCreate");
    const create = useTransactionCreate("outbound");

    create.form.value.docNumber = "OUT-001";
    create.form.value.transactionDate = "2026-07-18";
    create.form.value.warehouseId = "wh-1";
    create.form.value.partnerId = "cust-1";
    create.form.value.assignedById = "user-2";
    create.form.value.deadlineAt = "2026-07-25";
    create.form.value.notes = "Outbound task";
    create.form.value.lines.push({
        productId: "prod-1",
        qty: "2",
        locationId: "loc-a",
        fromLocationId: "",
        toLocationId: "",
    });

    await create.handleSubmit();

    expect(transactionService.create).toHaveBeenCalledWith("outbound", {
        companyId: "company-1",
        docNumber: "OUT-001",
        docDate: expect.any(String),
        customerId: "cust-1",
        assignedById: "user-2",
        deadlineAt: "2026-07-25",
        notes: "Outbound task",
        lines: [
            {
                productId: "prod-1",
                locationId: "loc-a",
                qtyExpected: 2,
            },
        ],
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/views/transactions/composables/useTransactionCreate.test.ts`
Expected: FAIL until the outbound form and payload include assignment metadata.

- [ ] **Step 3: Write minimal implementation**

Add outbound assignment fields to the form and keep the page layout consistent with the project:

```ts
const form = ref({
    docNumber: `TRX-${Date.now()}`,
    transactionDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    partnerId: "",
    assignedById: "",
    deadlineAt: "",
    notes: "",
    lines: [],
});
```

Load user options for outbound so the Assigned User selector can render:

```ts
if (isRegister.value || transactionKey === "outbound") {
    const usersResponse = await usersService.list({ limit: 200 });
    userOptions.value = usersResponse.items.map((u) => ({
        label: String(u.fullName ?? u.id),
        value: String(u.id),
    }));
}
```

Render outbound assignment fields in `TransactionCreatePage.vue`:

```vue
<Select
    v-if="transactionKey === 'outbound'"
    v-model="form.assignedById"
    :options="userOptions"
    label="Assigned User"
    placeholder="Select assigned user"
    required
/>

<Input
    v-if="transactionKey === 'outbound'"
    v-model="form.deadlineAt"
    label="Deadline"
    type="date"
    required
/>
```

Emit outbound payload fields in `handleSubmit()`:

```ts
case "outbound":
    finalPayload = {
        ...basePayload,
        docDate: docDateStr,
        customerId: form.value.partnerId || undefined,
        assignedById: form.value.assignedById,
        deadlineAt: form.value.deadlineAt || undefined,
        lines: form.value.lines.map((l) => ({
            productId: l.productId,
            locationId: l.locationId,
            qtyExpected: Number(l.qty),
        })),
    };
    break;
```

Keep `TransactionLineItems.vue` unchanged unless outbound needs a copy tweak for line labels.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/views/transactions/composables/useTransactionCreate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionCreate.ts src/views/transactions/TransactionCreatePage.vue src/views/transactions/components/TransactionLineItems.vue src/views/transactions/composables/useTransactionCreate.test.ts
git commit -m "feat: align outbound create flow"
```

### Task 3: Render outbound detail as a status-driven execution view

**Files:**

- Modify: `src/views/transactions/composables/useTransactionDetail.ts`
- Modify: `src/views/transactions/TransactionDetailPage.vue`
- Create: `src/views/transactions/components/OutboundDetailLines.vue`
- Test: `src/views/transactions/composables/useTransactionDetail.test.ts`

**Interfaces:**

- Consumes: outbound detail records with assignment metadata and line execution fields.
- Produces: outbound detail page copy, status badge semantics, and a read-only line execution table that matches the wireframe.

- [ ] **Step 1: Write the failing test**

```ts
it("renders outbound detail copy and line execution fields", async () => {
    const { useTransactionDetail } = await import("./useTransactionDetail");
    const detail = useTransactionDetail("outbound", "out-1");

    mocks.getSpy.mockResolvedValue({
        id: "out-1",
        docNo: "OUT-001",
        status: "posted",
        assignedBy: { fullName: "Asep" },
        deadlineAt: "2026-07-25T00:00:00.000Z",
        lines: [
            {
                id: "line-1",
                productId: "prod-1",
                qty: 2,
                locationId: "loc-a",
                checkedAt: null,
            },
        ],
    });

    await detail.loadTransaction();

    expect(detail.pageTagline.value).toBe("Transaction Detail");
    expect(detail.pageDescription.value).toContain("outbound transaction");
    expect(detail.canShowActions.value).toBe(false);
    expect(detail.lines.value).toHaveLength(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/views/transactions/composables/useTransactionDetail.test.ts`
Expected: FAIL until outbound detail rendering is split from the generic line table.

- [ ] **Step 3: Write minimal implementation**

Add outbound-specific computed state in `useTransactionDetail.ts`:

```ts
const isOutbound = computed(() => transactionKey === "outbound");
const isExecutionReadonly = computed(() =>
    ["posted", "partial", "dispatched", "done", "canceled"].includes(
        record.value?.status ?? "",
    ),
);
```

Render outbound line execution rows in a new component:

```vue
<template>
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Origin Location</th>
                <th>Check</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="line in lines" :key="line.id">
                <td>{{ line.product?.name || line.productId }}</td>
                <td>{{ line.qtyExpected ?? line.qty ?? "-" }}</td>
                <td>{{ line.location?.name || line.locationId }}</td>
                <td>
                    <input
                        type="checkbox"
                        :checked="Boolean(line.checkedAt)"
                        disabled
                    />
                </td>
            </tr>
        </tbody>
    </table>
</template>
```

Branch `TransactionDetailPage.vue` so outbound uses the new component and the generic table remains untouched for other transaction types.

Keep admin actions status-driven:

```ts
const canShowActions = computed(() =>
    Boolean(record.value && record.value.status === "draft"),
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/views/transactions/composables/useTransactionDetail.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/transactions/composables/useTransactionDetail.ts src/views/transactions/TransactionDetailPage.vue src/views/transactions/components/OutboundDetailLines.vue src/views/transactions/composables/useTransactionDetail.test.ts
git commit -m "feat: align outbound detail flow"
```

### Task 4: Expand the outbound backend state machine and execution endpoints

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `src/modules/warehouse/outbound/dto/outbound-doc.dto.ts`
- Create: `src/modules/warehouse/outbound/dto/outbound-execution.dto.ts`
- Modify: `src/modules/warehouse/outbound/dto/outbound-list-filter.dto.ts`
- Modify: `src/modules/warehouse/outbound/outbound.controller.ts`
- Modify: `src/modules/warehouse/outbound/outbound.service.ts`
- Modify: `src/modules/warehouse/outbound/outbound.controller.spec.ts`
- Modify: `src/modules/warehouse/outbound/outbound.service.spec.ts`

**Interfaces:**

- Consumes: outbound docs, outbound lines, and mobile execution updates.
- Produces: outbound persistence fields for assignment/execution, plus document and line endpoints that support `draft`, `posted`, `partial`, `dispatched`, `done`, and `canceled`.

- [ ] **Step 1: Write the failing test**

```ts
it("advances outbound through line checks, dispatch, and completion", async () => {
    const result = await service.updateLineCheck(
        "doc-1",
        "line-1",
        {
            checked: true,
        },
        mockUser,
    );

    expect(result.status).toBe("partial");

    const dispatched = await service.dispatch("doc-1", mockUser);
    expect(dispatched.status).toBe("dispatched");

    const done = await service.complete("doc-1", mockUser);
    expect(done.status).toBe("done");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/syillaeltaniadaffa/Documents/Warehouse-be && npx jest src/modules/warehouse/outbound/outbound.service.spec.ts --runInBand`
Expected: FAIL until the outbound schema and service understand assignment and execution progress.

- [ ] **Step 3: Write minimal implementation**

Extend `OutboundDoc` and `OutboundLine` with assignment and execution metadata:

```prisma
model OutboundDoc {
  deadlineAt   DateTime? @map("deadline_at") @db.Timestamptz(6)
  assignedById String?   @map("assigned_by") @db.Uuid
  assignedBy   User?     @relation("OutboundAssignedUser", fields: [assignedById], references: [id], onDelete: NoAction, onUpdate: NoAction)
}

model OutboundLine {
  checkedAt   DateTime? @map("checked_at") @db.Timestamptz(6)
  checkedById String?   @map("checked_by") @db.Uuid
  checkedBy   User?     @relation("OutboundLineCheckedBy", fields: [checkedById], references: [id], onDelete: NoAction, onUpdate: NoAction)
}
```

Expand the outbound DTOs:

```ts
export class OutboundExecutionDto {
    @ApiProperty({ description: "Set to true when the line is checked" })
    @IsBoolean()
    checked!: boolean;
}
```

Add a line endpoint and mobile progression endpoints in the controller:

```ts
@Patch(":id/lines/:lineId")
updateLineCheck(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("lineId", ParseUUIDPipe) lineId: string,
    @Body() dto: OutboundExecutionDto,
    @CurrentUser() user: RequestUser,
)

@Post(":id/dispatch")
dispatch(...)

@Post(":id/complete")
complete(...)
```

Implement the service rules:

```ts
const ACTIVE_STATUSES = ["draft", "posted", "partial", "dispatched"];

if (doc.status === "done" || doc.status === "canceled") {
    throw new BusinessRuleException(
        "Outbound document is no longer executable.",
    );
}
```

Keep list filtering and status validation aligned:

```ts
@ApiPropertyOptional({ description: "Filter by status: draft, posted, partial, dispatched, done, canceled" })
@IsIn(["draft", "posted", "partial", "dispatched", "done", "canceled"])
```

Generate the Prisma migration after the schema change and make sure the include sets return `assignedBy`, `deadlineAt`, `checkedAt`, and `checkedBy` in detail/list responses.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/syillaeltaniadaffa/Documents/Warehouse-be && npx jest src/modules/warehouse/outbound/outbound.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/modules/warehouse/outbound/dto/outbound-doc.dto.ts src/modules/warehouse/outbound/dto/outbound-execution.dto.ts src/modules/warehouse/outbound/dto/outbound-list-filter.dto.ts src/modules/warehouse/outbound/outbound.controller.ts src/modules/warehouse/outbound/outbound.service.ts src/modules/warehouse/outbound/outbound.controller.spec.ts src/modules/warehouse/outbound/outbound.service.spec.ts
git commit -m "feat: expand outbound execution state machine"
```

## Plan Coverage Check

- List page copy, columns, and normalization: Task 1
- Create page assignment metadata and payload: Task 2
- Detail page status-driven outbound execution view: Task 3
- Backend state machine, schema, and execution endpoints: Task 4

## Self-Review Notes

- No placeholder language remains in the plan.
- The list page task explicitly covers the wireframe's assigned-user and deadline columns.
- The create task explicitly adds outbound assignment fields so the web admin can create executable tasks.
- The detail task keeps non-outbound transaction behavior untouched by branching the outbound table into a dedicated component.
- The backend task now includes both the status machine and the per-line execution endpoints required for mobile-driven progress.
