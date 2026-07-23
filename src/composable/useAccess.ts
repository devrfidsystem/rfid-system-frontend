import { computed } from "vue";
import { useAuthStore } from "@/store/auth.store";
import type { MenuTreeNode } from "@/services/auth.service";

const normalizePath = (input: string) => {
    if (!input) return "/";
    const trimmed = input.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
};

const flattenTree = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
    const result: MenuTreeNode[] = [];
    const traverse = (node: MenuTreeNode) => {
        result.push(node);
        node.children.forEach(traverse);
    };
    nodes.forEach(traverse);
    return result;
};

const cloneMenuNode = (node: MenuTreeNode): MenuTreeNode => ({
    ...node,
    children: node.children.map(cloneMenuNode),
});

const isRegisterTagsNode = (node: MenuTreeNode): boolean => {
    const code = node.code.toUpperCase();
    const name = node.name.toUpperCase();
    return code === "TRANSACTION_REGISTER" || name === "REGISTER";
};

const normalizeMenuTree = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
    const clonedRoots = nodes.map(cloneMenuNode);
    const transactions = clonedRoots.find(
        (node) => node.code === "TRANSACTIONS",
    );
    if (!transactions) {
        return clonedRoots;
    }

    const movedChildren: MenuTreeNode[] = [];
    const filteredRoots: MenuTreeNode[] = [];

    for (const node of clonedRoots) {
        if (isRegisterTagsNode(node)) {
            movedChildren.push(...node.children);
            continue;
        }

        filteredRoots.push(node);
    }

    if (movedChildren.length === 0) {
        return filteredRoots;
    }

    const registerTagsNode: MenuTreeNode = {
        id: "synthetic-register-tags",
        code: "TRANSACTION_REGISTER",
        name: "Register",
        path: "/transactions/register",
        parentId: transactions.id,
        sortOrder: 0,
        sort_order: 0,
        icon: "Radio",
        permissions: {
            canView: true,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
        },
        children: [],
    };

    const dedupedChildren = new Map<string, MenuTreeNode>();
    for (const child of movedChildren) {
        if (!dedupedChildren.has(child.code)) {
            dedupedChildren.set(child.code, child);
        }
    }

    registerTagsNode.children = Array.from(dedupedChildren.values()).sort(
        (a, b) =>
            (a.sortOrder ?? a.sort_order ?? 0) -
            (b.sortOrder ?? b.sort_order ?? 0),
    );

    const transactionChildren = [...transactions.children];
    const existingIndex = transactionChildren.findIndex(
        (child) => child.code === registerTagsNode.code,
    );

    if (existingIndex === -1) {
        transactionChildren.unshift(registerTagsNode);
    } else {
        transactionChildren[existingIndex] = {
            ...transactionChildren[existingIndex],
            name: "Register",
            path: "/transactions/register",
            children: registerTagsNode.children,
        };
    }

    transactions.children = transactionChildren.sort(
        (a, b) =>
            (a.sortOrder ?? a.sort_order ?? 0) -
            (b.sortOrder ?? b.sort_order ?? 0),
    );

    return filteredRoots;
};

export function useAccess() {
    const authStore = useAuthStore();

    const menuTree = computed(() =>
        normalizeMenuTree(authStore.profile?.menuTree ?? []),
    );

    const flattenedNodes = computed(() =>
        flattenTree(menuTree.value).filter(
            (node) => node.permissions.canView && Boolean(node.path),
        ),
    );

    const firstAccessiblePath = computed(
        () => flattenedNodes.value[0]?.path ?? "/dashboard",
    );

    const hasPathAccess = (path: string) => {
        if (!path) return false;
        const normalizedPath = normalizePath(path);
        return flattenedNodes.value.some((node) => {
            const nodePath = normalizePath(node.path ?? "");
            return (
                nodePath &&
                (normalizedPath === nodePath ||
                    normalizedPath.startsWith(`${nodePath}/`))
            );
        });
    };

    const getMenuNodeForPath = (path: string) => {
        if (!path) return undefined;
        const normalizedPath = normalizePath(path);
        return flattenedNodes.value.find((node) => {
            const nodePath = normalizePath(node.path ?? "");
            return (
                nodePath &&
                (normalizedPath === nodePath ||
                    normalizedPath.startsWith(`${nodePath}/`))
            );
        });
    };

    return {
        menuTree,
        flattenedNodes,
        hasPathAccess,
        getMenuNodeForPath,
        firstAccessiblePath,
    };
}
