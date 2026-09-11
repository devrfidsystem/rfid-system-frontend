import { describe, expect, it } from "vitest";
import {
    buildLocationPickerRows,
    taggedDescendantLeafIds,
    toggleLeaf,
    toggleParent,
    type LocationPickerLocation,
} from "./opnameLocationPicker";

const locations: LocationPickerLocation[] = [
    { id: "floor-a", parentId: null, code: "FA", name: "Floor A", epc: "EPC-FA" },
    { id: "rack-a", parentId: "floor-a", code: "RA", name: "Rack A", epc: "EPC-A" },
    { id: "rack-c", parentId: "floor-a", code: "RC", name: "Rack C", epc: "EPC-C" },
    { id: "rack-d", parentId: "floor-a", code: "RD", name: "Rack D", epc: "EPC-D" },
    { id: "rack-e", parentId: "floor-a", code: "RE", name: "Rack E", epc: null },
];

describe("opnameLocationPicker", () => {
    it("selects only tagged descendant leaves when checking a parent", () => {
        const selected = toggleParent("floor-a", [], locations);
        expect(selected.sort()).toEqual(["rack-a", "rack-c", "rack-d"].sort());
        expect(selected).not.toContain("floor-a");
        expect(selected).not.toContain("rack-e");
    });

    it("unchecks a single tagged leaf", () => {
        const all = taggedDescendantLeafIds("floor-a", locations);
        const next = toggleLeaf("rack-c", all);
        expect(next.sort()).toEqual(["rack-a", "rack-d"].sort());
    });

    it("marks untagged leaves as not selectable", () => {
        const rows = buildLocationPickerRows(locations);
        const floor = rows[0];
        const untagged = floor?.children.find((row) => row.id === "rack-e");
        expect(untagged?.selectable).toBe(false);
        expect(floor?.children.find((row) => row.id === "rack-a")?.selectable).toBe(
            true,
        );
    });
});
