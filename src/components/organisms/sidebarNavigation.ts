import type { Component } from "vue";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Box,
    Database,
    FileText,
    LayoutDashboard,
    Layers,
    Map,
    MapPin,
    Radar,
    Radio,
    Ruler,
    ScrollText,
    Settings2,
    Shield,
    Store,
    TrendingUp,
    Truck,
    Users,
    Warehouse,
    Workflow,
} from "lucide-vue-next";
import type { MenuTreeNode } from "@/services/auth.service";
import { isSupportedMasterPath } from "@/domain/master/entityConfig";

export type SidebarScope =
    | "all"
    | "dashboard"
    | "master-data"
    | "iam"
    | "stock"
    | "transactions"
    | "settings";

export type SidebarNavItem = {
    id: string;
    code: string;
    title: string;
    path: string | null;
    icon: Component;
    children: SidebarNavItem[];
    sortOrder: number;
};

export type SidebarFlatItem = SidebarNavItem & {
    depth: number;
};

const iconMap: Record<string, Component> = {
    DASHBOARD: LayoutDashboard,
    DASHBOARD_OVERVIEW: LayoutDashboard,
    DASHBOARD_LOW_STOCK: Layers,
    DASHBOARD_RECENT_ACTIVITY: ScrollText,
    DASHBOARD_EPC_STATUS: Radio,
    DASHBOARD_KPI: TrendingUp,
    DASHBOARD_PROCESS: Workflow,
    DASHBOARD_MONITORING: Radar,
    MASTER: Database,
    MASTER_DATA: Database,
    WAREHOUSES: Warehouse,
    LOCATIONS: MapPin,
    PRODUCTS: Box,
    PRODUCT_CATEGORIES: Layers,
    UOMS: Ruler,
    CUSTOMERS: Users,
    SUPPLIERS: Truck,
    ATTRIBUTES: Shield,
    TRANSACTIONS: FileText,
    TRANSACTION_INBOUND: ArrowDownToLine,
    TRANSACTION_REGISTER: Radio,
    TRANSACTION_PUTAWAY: Warehouse,
    TRANSACTION_OUTBOUND: ArrowUpFromLine,
    TRANSACTION_RELOCATION: Map,
    TRANSACTION_TRANSFER: Truck,
    TRANSACTION_RETURN: ArrowDownToLine,
    TRANSACTION_RETURNS: ArrowDownToLine,
    TRANSACTION_OPNAME: FileText,
    STOCK: Layers,
    STOCK_BALANCE: Layers,
    STOCK_LEDGER: ScrollText,
    LOG: ScrollText,
    SETTINGS: Settings2,
    SETTINGS_APPS: Settings2,
    SETTINGS_COMPANIES: Store,
    SETTINGS_MENUS: Settings2,
    USERS: Users,
    DEFAULT: LayoutDashboard,
};

const routeOverrides: Record<string, string> = {
    ATTRIBUTES: "/master-data/attributes",
    CUSTOMERS: "/master-data/customers",
    LOCATIONS: "/master-data/locations",
    PRODUCTS: "/master-data/products",
    PRODUCT_CATEGORIES: "/master-data/product-categories",
    SUPPLIERS: "/master-data/suppliers",
    UOMS: "/master-data/uoms",
    WAREHOUSES: "/master-data/warehouses",
};

const scopeRules: Record<
    Exclude<SidebarScope, "all">,
    Array<(node: MenuTreeNode) => boolean>
> = {
    dashboard: [(node) => node.code.toUpperCase().startsWith("DASHBOARD")],
    "master-data": [
        (node) => node.code.toUpperCase().includes("MASTER"),
        (node) => node.name.toUpperCase().includes("MASTER"),
        (node) => node.path?.startsWith("/master-data") ?? false,
    ],
    iam: [
        (node) => node.code.toUpperCase().includes("IAM"),
        (node) => node.name.toUpperCase().includes("IAM"),
        (node) => node.name.toUpperCase().includes("ACCESS"),
        (node) => node.name.toUpperCase().includes("ROLE"),
        (node) => node.name.toUpperCase().includes("USER"),
        (node) => node.path?.startsWith("/iam") ?? false,
        (node) =>
            ["USER", "USERS", "ACCESS", "ROLE", "ROLES"].includes(
                node.code.toUpperCase(),
            ),
    ],
    stock: [(node) => node.code.toUpperCase().startsWith("STOCK")],
    transactions: [
        (node) => node.code.toUpperCase().startsWith("TRANSACTION"),
        (node) => node.code.toUpperCase().startsWith("RFID"),
    ],
    settings: [
        (node) => node.code.toUpperCase().startsWith("SETTINGS"),
        (node) => node.code.toUpperCase().startsWith("SETTING"),
        (node) => node.code.toUpperCase() === "LOG",
    ],
};

const normalizeSort = (node: MenuTreeNode) =>
    node.sortOrder ?? node.sort_order ?? 0;

const getIcon = (code?: string | null) => {
    const normalized = code?.toUpperCase() ?? "DEFAULT";
    return iconMap[normalized] ?? iconMap.DEFAULT;
};

const resolveMenuPath = (node: MenuTreeNode) => {
    const override = routeOverrides[node.code.toUpperCase()];
    return override ?? node.path;
};

const isMasterEntityPath = (path: string) => {
    const normalized = path.replace(/\/+$/, "");
    const isMasterRoot =
        normalized === "/master-data" || normalized === "/master";
    if (isMasterRoot) return false;

    const isMasterBranch =
        normalized.startsWith("/master-data/") ||
        normalized.startsWith("/master/");
    if (!isMasterBranch) return false;

    const [, , segment] = normalized.split("/");
    return Boolean(segment);
};

export const sidebarIconMap = iconMap;

export const buildSidebarNavItems = (
    nodes: MenuTreeNode[],
    scope: SidebarScope = "all",
): SidebarNavItem[] => {
    const isNodeInScope = (node: MenuTreeNode): boolean => {
        if (scope === "all") return true;

        const rules = scopeRules[scope];
        if (!rules?.length) return true;

        const selfMatches = rules.some((rule) => rule(node));
        if (selfMatches) return true;

        return node.children.some(isNodeInScope);
    };

    const toNavItem = (node: MenuTreeNode): SidebarNavItem | null => {
        const resolvedPath = resolveMenuPath(node);
        const children = node.children
            .filter(isNodeInScope)
            .map((child) => toNavItem(child))
            .filter((child): child is SidebarNavItem => Boolean(child))
            .sort((a, b) => a.sortOrder - b.sortOrder);

        if (
            resolvedPath &&
            isMasterEntityPath(resolvedPath) &&
            !isSupportedMasterPath(resolvedPath)
        ) {
            return children.length
                ? {
                      id: node.id,
                      code: node.code,
                      title: node.name,
                      path: null,
                      icon: getIcon(node.code),
                      children,
                      sortOrder: normalizeSort(node),
                  }
                : null;
        }

        if (!node.permissions.canView && !children.length) return null;
        if (!resolvedPath && !children.length) {
            return null;
        }

        return {
            id: node.id,
            code: node.code,
            title: node.name,
            path: resolvedPath,
            icon: getIcon(node.code),
            children,
            sortOrder: normalizeSort(node),
        };
    };

    return nodes
        .filter(isNodeInScope)
        .map((node) => toNavItem(node))
        .filter((item): item is SidebarNavItem => Boolean(item))
        .sort((a, b) => a.sortOrder - b.sortOrder);
};

export const flattenSidebarNavItems = (
    items: SidebarNavItem[],
): SidebarFlatItem[] => {
    const result: SidebarFlatItem[] = [];

    const walk = (currentItems: SidebarNavItem[], depth: number) => {
        for (const item of currentItems) {
            result.push({
                ...item,
                depth,
            });
            if (item.children.length) {
                walk(item.children, depth + 1);
            }
        }
    };

    walk(items, 0);
    return result;
};
