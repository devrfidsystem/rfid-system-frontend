import { describe, expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import AccessAssignmentCard from "./AccessAssignmentCard.vue";

describe("AccessAssignmentCard", () => {
    it("renders assignment controls, items, and remove actions consistently", async () => {
        const app = createSSRApp(AccessAssignmentCard, {
            title: "Assigned Roles",
            modelValue: "",
            options: [{ label: "Picker", value: "role-1" }],
            items: [{ id: "role-1", label: "Picker" }],
            selectLabel: "Add Role",
            selectPlaceholder: "Select role",
            emptyText: "No roles assigned.",
            objectIdPrefix: "UserAccessRole",
            removable: true,
        });

        const html = await renderToString(app);

        expect(html).toContain("Assigned Roles");
        expect(html).toContain("Add Role");
        expect(html).toContain("Picker");
        expect(html).toContain("btn_UserAccessRoleAdd");
        expect(html).toContain("btn_UserAccessRoleRemove_role-1");
        expect(html).toContain("bg-danger-500");
    });

    it("renders empty copy without a remove action when items are empty", async () => {
        const app = createSSRApp(AccessAssignmentCard, {
            title: "Company Affiliation",
            modelValue: "",
            options: [],
            items: [],
            selectLabel: "Assign Company",
            selectPlaceholder: "Select company",
            emptyText: "No companies assigned.",
            objectIdPrefix: "UserAccessCompany",
            removable: false,
        });

        const html = await renderToString(app);

        expect(html).toContain("No companies assigned.");
        expect(html).not.toContain("Remove");
    });
});
