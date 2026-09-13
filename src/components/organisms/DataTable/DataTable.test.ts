import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import DataTable from "./DataTable.vue";
import type { ColumnDef } from "./types";

describe("DataTable", () => {
    it("wraps wide tables with horizontal overflow so row actions are not clipped", async () => {
        const columns: ColumnDef<Record<string, unknown>>[] = Array.from(
            { length: 11 },
            (_, index) => ({
                key: `column${index + 1}`,
                header: `Column ${index + 1}`,
            }),
        );
        const row = columns.reduce<Record<string, unknown>>(
            (acc, column) => {
                acc[column.key] = `${column.header} value`;
                return acc;
            },
            { id: "product-1" },
        );

        const app = createSSRApp({
            render: () =>
                h(
                    DataTable,
                    {
                        rows: [row],
                        columns,
                        rowKey: (item: Record<string, unknown>) =>
                            String(item.id),
                        showSearch: false,
                    },
                    {
                        rowActions: () =>
                            h("button", { type: "button" }, "Edit product"),
                    },
                ),
        });

        const html = await renderToString(app);

        expect(html).toContain("overflow-x-auto");
        expect(html).toContain("sticky right-0");
        expect(html).toContain("Actions");
        expect(html).toContain("Edit product");
    });

    it("renders tree rows with chevron toggles and clear nested spacing", async () => {
        const columns: ColumnDef<Record<string, unknown>>[] = [
            { key: "warehouse", header: "Warehouse" },
            { key: "path", header: "Path" },
        ];
        const app = createSSRApp({
            render: () =>
                h(DataTable, {
                    rows: [
                        {
                            id: "zone-a",
                            warehouse: "Main",
                            path: "Zone A",
                            treeDepth: 0,
                            treeHasChildren: true,
                            treeExpanded: true,
                        },
                        {
                            id: "zone-b",
                            warehouse: "Main",
                            path: "Zone B",
                            treeDepth: 0,
                            treeHasChildren: true,
                            treeExpanded: false,
                        },
                        {
                            id: "rack-1",
                            warehouse: "Main",
                            path: "Zone A > Rack 1",
                            treeDepth: 1,
                            treeHasChildren: false,
                        },
                    ],
                    columns,
                    rowKey: (item: Record<string, unknown>) => String(item.id),
                    showSearch: false,
                    treeColumnKey: "path",
                }),
        });

        const html = await renderToString(app);

        expect(html).toContain("lucide-chevron-down");
        expect(html).toContain("lucide-chevron-right");
        expect(html).toContain("margin-inline-start:1.75rem");
        expect(html).not.toContain("border-l-2");
        expect(html).not.toContain("bg-surface-secondary/50");
        expect(html).not.toContain("padding-inline-start");
    });
});
