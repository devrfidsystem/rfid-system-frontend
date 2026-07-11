import { describe, expect, it } from "vitest";
import {
    buildLocationPathLabel,
    buildLocationTreeSubtitle,
    buildLocationTreeRows,
    resolveLocationParentLabel,
    resolveLocationWarehouseLabel,
} from "./locationTree";
import type { MasterRecord } from "./types";

describe("locationTree", () => {
    const warehouseOptions = new Map<string, string>([
        ["wh-1", "Main Warehouse"],
    ]);

    const rowsById = new Map<string, MasterRecord>([
        [
            "loc-1",
            {
                id: "loc-1",
                name: "Zone A",
                warehouseId: "wh-1",
                depth: 0,
                path: "/loc-1",
            },
        ],
        [
            "loc-2",
            {
                id: "loc-2",
                name: "Rack 1",
                warehouseId: "wh-1",
                parentId: "loc-1",
                depth: 1,
                path: "/loc-1/loc-2",
            },
        ],
        [
            "loc-3",
            {
                id: "loc-3",
                name: "Bin 2",
                warehouseId: "wh-1",
                parentId: "loc-2",
                depth: 2,
                path: "/loc-1/loc-2/loc-3",
            },
        ],
        [
            "loc-4",
            {
                id: "loc-4",
                name: "Shelf 9",
                warehouseId: "wh-1",
                parentId: "loc-3",
                depth: 3,
                path: "/loc-1/loc-2/loc-3/loc-4",
            },
        ],
    ]);

    it("resolves warehouse and parent labels without showing ids", () => {
        const row = rowsById.get("loc-3") as MasterRecord;

        expect(resolveLocationWarehouseLabel(row, warehouseOptions)).toBe(
            "Main Warehouse",
        );
        expect(resolveLocationParentLabel(row, rowsById)).toBe("Rack 1");
    });

    it("builds a multi-level readable path", () => {
        const row = rowsById.get("loc-3") as MasterRecord;

        expect(buildLocationPathLabel(row, rowsById, warehouseOptions)).toBe(
            "Main Warehouse > Zone A > Rack 1 > Bin 2",
        );
    });

    it("builds a tree subtitle with warehouse and parent labels", () => {
        const row = rowsById.get("loc-3") as MasterRecord;

        expect(
            buildLocationTreeSubtitle(row, rowsById, warehouseOptions),
        ).toBe("Main Warehouse • Parent: Rack 1");
    });

    it("builds an expandable tree list for visible location rows", () => {
        const treeRows = buildLocationTreeRows(
            Array.from(rowsById.values()),
            new Set(["loc-1", "loc-2", "loc-3"]),
        );

        expect(treeRows.map((row) => row.id)).toEqual([
            "loc-1",
            "loc-2",
            "loc-3",
            "loc-4",
        ]);
        expect(treeRows[0]?.treeDepth).toBe(0);
        expect(treeRows[0]?.treeHasChildren).toBe(true);
        expect(treeRows[0]?.treeExpanded).toBe(true);
        expect(treeRows[1]?.treeDepth).toBe(1);
        expect(treeRows[2]?.treeDepth).toBe(2);
        expect(treeRows[3]?.treeDepth).toBe(3);
        expect(treeRows[3]?.treeGuides).toEqual([false, false, false]);
    });
});
