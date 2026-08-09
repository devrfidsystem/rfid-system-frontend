import { describe, expect, it } from "vitest";
import toolbarSource from "./DataTableToolbar.vue?raw";
import dataTableSource from "./DataTable.vue?raw";

describe("DataTableToolbar design-system usage", () => {
    it("uses Input and Select atoms for toolbar controls", () => {
        expect(toolbarSource).toContain("<Input");
        expect(toolbarSource).toContain("<Select");
        expect(toolbarSource).toContain(
            'import Input from "@/components/atoms/Input.vue";',
        );
        expect(toolbarSource).toContain(
            'import Select from "@/components/atoms/Select.vue";',
        );
        expect(toolbarSource).not.toContain("<input");
        expect(toolbarSource).not.toContain("<select");
        expect(toolbarSource).not.toContain("focus-within:ring-2");
    });

    it("uses internal table checkbox and skeleton primitives", () => {
        expect(dataTableSource).toContain("<TableCheckbox");
        expect(dataTableSource).toContain("<SkeletonBlock");
        expect(dataTableSource).toContain(
            'import TableCheckbox from "./TableCheckbox.vue";',
        );
        expect(dataTableSource).toContain(
            'import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";',
        );
        expect(dataTableSource).not.toContain(
            "h-4 w-4 rounded border border-border text-primary-600",
        );
        expect(dataTableSource).not.toContain("animate-pulse rounded bg-surface-secondary");
    });
});
