import type { OpnameTreeNode } from "@/api/feature/dto/opname.dto";

export type {
    OpnameNodeType,
    OpnameTreeNode,
} from "@/api/feature/dto/opname.dto";

export interface OpnameTreeRow extends OpnameTreeNode {
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
}

const sortByTitle = (a: OpnameTreeNode, b: OpnameTreeNode) =>
    a.title.localeCompare(b.title);

const normalizeNestedTree = (nodes: OpnameTreeNode[]): OpnameTreeNode[] => {
    const cloned = nodes.map((node) => ({
        ...node,
        children: normalizeNestedTree(node.children ?? []),
    }));
    cloned.sort(sortByTitle);
    return cloned;
};

export const normalizeOpnameTree = (nodes: OpnameTreeNode[]) => {
    if (nodes.some((node) => (node.children?.length ?? 0) > 0)) {
        return normalizeNestedTree(nodes);
    }

    const byId = new Map<string, OpnameTreeNode>();
    const roots: OpnameTreeNode[] = [];

    nodes.forEach((node) => {
        byId.set(node.id, { ...node, children: [] });
    });

    byId.forEach((node) => {
        if (node.parentId && byId.has(node.parentId)) {
            byId.get(node.parentId)?.children?.push(node);
            return;
        }
        roots.push(node);
    });

    const sortTree = (items: OpnameTreeNode[]) => {
        items.sort(sortByTitle);
        items.forEach((item) => item.children && sortTree(item.children));
    };

    sortTree(roots);
    return roots;
};

export const flattenOpnameTree = (
    nodes: OpnameTreeNode[],
    expandedIds: Set<string>,
) => {
    const ordered: OpnameTreeRow[] = [];

    const walk = (items: OpnameTreeNode[], depth: number) => {
        items.forEach((node) => {
            const children = node.children ?? [];
            const expanded = children.length > 0 && expandedIds.has(node.id);
            ordered.push({
                ...node,
                depth,
                hasChildren: children.length > 0,
                expanded,
            });
            if (expanded) {
                walk(children, depth + 1);
            }
        });
    };

    walk(nodes, 0);
    return ordered;
};
