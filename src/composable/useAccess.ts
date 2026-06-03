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

export function useAccess() {
    const authStore = useAuthStore();

    const menuTree = computed(() => authStore.profile?.menuTree ?? []);

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
