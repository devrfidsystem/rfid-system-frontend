import { describe, expect, it } from "vitest";
import {
    flattenOpnameTree,
    normalizeOpnameTree,
    type OpnameTreeNode,
} from "./opnameTree";

describe("opnameTree", () => {
    const rows: OpnameTreeNode[] = [
        {
            id: "root-1",
            parentId: null,
            companyId: "company-1",
            warehouse_id: "wh-1",
            profile_id: "OP-ROOT",
            title: "Stock Opname A",
            description: null,
            task_group: null,
            task_period: null,
            status: "draft",
            nodeType: "group",
        },
        {
            id: "profile-1",
            parentId: "root-1",
            companyId: "company-1",
            warehouse_id: "wh-1",
            profile_id: "OP-PROFILE",
            title: "Group Q1",
            description: null,
            task_group: null,
            task_period: null,
            status: "draft",
            nodeType: "profile",
        },
        {
            id: "task-1",
            parentId: "profile-1",
            companyId: "company-1",
            warehouse_id: "wh-1",
            profile_id: "OP-TASK",
            title: "Floor A",
            description: null,
            task_group: null,
            task_period: null,
            status: "draft",
            nodeType: "task",
        },
    ];

    it("normalizes a flat list into a recursive tree", () => {
        const tree = normalizeOpnameTree(rows);

        expect(tree).toHaveLength(1);
        expect(tree[0]?.children?.[0]?.id).toBe("profile-1");
        expect(tree[0]?.children?.[0]?.children?.[0]?.id).toBe("task-1");
    });

    it("preserves a nested tree returned by the backend", () => {
        const tree = normalizeOpnameTree([
            {
                ...rows[0],
                children: [
                    {
                        ...rows[1],
                        children: [rows[2]],
                    },
                ],
            },
        ]);

        expect(tree).toHaveLength(1);
        expect(tree[0]?.children).toHaveLength(1);
        expect(tree[0]?.children?.[0]?.children).toHaveLength(1);
    });

    it("flattens only expanded branches", () => {
        const tree = normalizeOpnameTree(rows);
        const visible = flattenOpnameTree(
            tree,
            new Set(["root-1", "profile-1"]),
        );

        expect(visible.map((row) => row.id)).toEqual([
            "root-1",
            "profile-1",
            "task-1",
        ]);
        expect(visible[0]?.depth).toBe(0);
        expect(visible[1]?.depth).toBe(1);
        expect(visible[2]?.depth).toBe(2);
    });
});
