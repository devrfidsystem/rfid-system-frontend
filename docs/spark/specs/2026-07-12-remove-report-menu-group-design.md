# Remove Report Menu Group Design

## Context

The "Report" menu group (`src/views/report/`) exposes 9 report entities, each rendering the same data as an existing Transaction or Stock page plus an "Export XLS" button. Investigation confirmed:

- **6 entities** (`inbound`, `outbound`, `relocation`, `transfer`, `return`, `stock-opname`) are pure duplicates of Transaction list pages. The Transaction module (`useTransactionList.ts`) already imports `reportConfigs`/`reportService` directly and has its own working "Export XLS" button — these Report pages add nothing Transaction doesn't already have.
- **2 entities** (`current-stock`, `stock-period`) duplicate Stock Balance/Ledger data, but Stock pages currently have no export button — this is the one real capability gap to close.
- **1 entity** (`opname-variance`) has no Transaction/Stock equivalent. Per user decision, this is dropped entirely — not migrated anywhere.

Goal: delete the Report menu/pages/routes, and add the export capability directly to Stock Balance and Stock Ledger so no functionality is lost for those two.

## Scope

**In scope:**
- Delete Report's page components and routes.
- Remove the "Reports" entry from the Rail and the sidebar scope-matching rule.
- Remove the `opname-variance` entry from `reportConfig.ts`.
- Add an "Export XLS" button to `StockBalancePage.vue` and `StockLedgerPage.vue`, wired to the existing `reportService.exportReport` mechanism with the `current-stock` / `stock-period` keys respectively — replicating the exact pattern already used by `useTransactionList.ts`'s `exportRows`.

**Out of scope / explicit non-goals:**
- Renaming `reportConfig.ts`/`reportService.ts`/`report.api.ts`/`report.dto.ts` — these stay in place and keep their names. `reportConfig.ts` stays at `src/views/report/reportConfig.ts` (the only file remaining in that directory) because `useTransactionList.ts`, `useTransactionDetail.ts`, `TransactionTable.vue`, `report.api.ts`, and `report.service.ts` all import from that exact path — moving it is a larger, unrelated refactor with no behavioral benefit.
- Backend/database changes. The sidebar's "Reports" menu item is populated from a backend-managed menu tree (the Menu Management feature under Settings > Menus), matched on the frontend by a `code.startsWith("REPORT")` rule. Deleting the frontend routes and rail entry does **not** remove that backend menu node — after this change ships, the "Reports" entry must be deactivated or deleted via Settings > Menus (or directly in the backend) or it will appear in the sidebar as a dead link. This is called out, not silently handled, because it requires a data change outside this frontend codebase.

## Deletions

Files removed entirely:
- `src/views/report/ReportEntityPage.vue`
- `src/views/report/components/ReportHeader.vue`
- `src/views/report/components/ReportTable.vue`
- `src/views/report/composables/useReportEntity.ts`
- `src/components/templates/ReportLayout.vue` and its `ReportLayout.stories.ts` (this is the layout the deleted `/reports` parent route mounted — confirmed via `router/index.ts`'s `import("@/components/templates/ReportLayout.vue")`; it lives under `templates/`, not `views/report/`)

Files kept, edited:
- `src/views/report/reportConfig.ts` — remove the `"opname-variance"` key from `reportConfigs`, remove `"opname-variance"` from the `ReportKey` union type. Keep the `ClipboardCheck` import — `stock-opname` also uses it.
- `src/router/index.ts` — remove `reportChildRoutes`, the `resolveReportSegment` helper, the `/reports` parent route block (~line 231-240) that mounts `ReportLayout.vue`, and the legacy `path: "report"` redirect (~line 271-272). Confirmed `reportConfigs`/`ReportKey` (line 9) and `reportPaths` (line 11) are used only by the code being deleted (`resolveReportSegment`, `reportChildRoutes`) — remove both imports entirely.
- `src/components/templates/AppLayout.vue` — remove the `{ id: "reports", icon: LineChart, label: "Reports", to: "/reports/stock-movement" }` entry from `railItems` (line 145), remove the `reports` key from `railScopeMap`. Confirmed `LineChart` (imported line 83) is used only by this one rail item — remove the import too.
- `src/components/organisms/sidebarNavigation.ts` — remove `"reports"` from the `SidebarScope` union type, remove the `reports: [(node) => node.code.toUpperCase().startsWith("REPORT")]` entry from `scopeRules`, remove the `REPORT`/`REPORTS` → `LineChart` icon-map entries (lines 82-83). Confirmed `LOG` maps to `ScrollText` (line 84), not `LineChart` — no other scope uses it, so remove the `LineChart` import too.

Files unchanged (confirmed still needed):
- `src/services/report.service.ts`, `src/api/feature/report.api.ts`, `src/api/feature/dto/report.dto.ts` — the generic fetch/export mechanism Transaction and (after this change) Stock both depend on.

## Stock export addition

Both `useStockBalance.ts` and `useStockLedger.ts` gain an `exportRows` function, copied from `useTransactionList.ts:297-323`'s pattern:

```ts
const exportRows = async () => {
    try {
        const params = { /* same shape already built for loadRows */ };
        const blob = await reportService.exportReport(
            "current-stock", // or "stock-period" for the ledger
            params,
            reportConfigs["current-stock"].columns, // or ["stock-period"].columns
        );
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `${reportConfigs["current-stock"].title}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to export.";
    }
};
```

Each composable imports `reportService` from `@/services/report.service` and `reportConfigs` from `@/views/report/reportConfig` (the same import path Transaction already uses — confirms this path must stay stable, reinforcing the "don't move reportConfig.ts" decision above). `exportRows` is added to each composable's returned object.

`StockBalancePage.vue` and `StockLedgerPage.vue` templates each get one more `<Button>` in their existing toolbar row (next to the current Filter/Sort-removed/Refresh buttons), following the same icon+label pattern as `TransactionHeader.vue`'s export button (a `Download` icon from `lucide-vue-next`, `variant="outline"`), calling the new `exportRows`.

## Verification

- `npm run type-check` and `npx eslint --fix` on every touched/deleted-referencing file.
- `grep -rn "views/report/Report\|reportChildRoutes\|resolveReportSegment" src/` returns nothing after deletion (confirms no dangling imports).
- Manual browser check via the `run` skill: confirm `/reports/*` routes now 404 or are gone from the router (expected — this is intentional), confirm the Rail no longer shows a "Reports" icon, confirm Stock Balance and Stock Ledger pages each show a working "Export XLS" button that downloads an `.xlsx` file, and confirm Transaction pages' existing export still works unchanged (regression check on the shared `reportConfig.ts`/`reportService.ts` path).
