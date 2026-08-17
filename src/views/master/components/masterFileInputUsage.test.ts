import { describe, expect, it } from "vitest";
import masterImportDialogSource from "./MasterImportDialog.vue?raw";
import masterFormModalSource from "./MasterFormModal.vue?raw";

const masterFileSources = [masterImportDialogSource, masterFormModalSource];

describe("master file input usage", () => {
    it("uses FileInput for master upload controls", () => {
        for (const source of masterFileSources) {
            expect(source).toContain("<FileInput");
            expect(source).toContain(
                'import FileInput from "@/components/ui/form/FileInput.vue";',
            );
            expect(source).not.toContain("file:bg-primary-50");
            expect(source).not.toContain('type="file"');
        }
    });

    it("uses Textarea atom for master multiline fields", () => {
        expect(masterFormModalSource).toContain("<Textarea");
        expect(masterFormModalSource).toContain(
            'import Textarea from "@/components/atoms/Textarea.vue";',
        );
        expect(masterFormModalSource).not.toContain("<textarea");
        expect(masterFormModalSource).not.toContain(
            "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30",
        );
    });

    it("aligns master form and import footer actions with space between", () => {
        expect(masterFormModalSource).toContain("justify-between");
        expect(masterImportDialogSource).toContain("justify-between");
        expect(masterFormModalSource).not.toContain(
            "mt-auto flex justify-end gap-3 border-t border-border pt-4",
        );
        expect(masterImportDialogSource).not.toContain(
            "flex justify-end gap-3 border-t border-border pt-4",
        );
    });
});
