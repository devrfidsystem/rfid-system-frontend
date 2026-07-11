<template>
    <aside
        class="sticky top-0 h-screen overflow-x-hidden border-r border-border bg-surface transition-[width] duration-200 ease-out"
        :class="sidebarCollapsed ? 'w-20' : 'w-[280px]'"
    >
        <div class="flex h-full flex-col px-3 py-5">
            <!-- Brand Logo -->
            <div
                class="mb-8 flex items-center"
                :class="
                    sidebarCollapsed ? 'justify-center' : 'justify-center mt-2'
                "
            >
                <img
                    v-if="!sidebarCollapsed"
                    :src="AppLogo"
                    alt="ALIR Smart System"
                    class="w-28 h-auto object-contain"
                />
                <div
                    v-else
                    class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-50 ring-1 ring-primary-100"
                >
                    <Icon
                        :icon="LayoutDashboard"
                        :size="20"
                        class-name="text-primary-600"
                    />
                </div>
            </div>

            <!-- Search Menu -->
            <div v-if="!sidebarCollapsed" class="mb-4">
                <div class="relative group">
                    <label for="txt_SidebarSearch" class="sr-only">
                        Search menu
                    </label>
                    <Icon
                        class-name="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary-600"
                        :icon="Search"
                        :size="16"
                    />
                    <input
                        id="txt_SidebarSearch"
                        v-model="searchQuery"
                        placeholder="Search menu..."
                        class="w-full rounded-md border border-transparent bg-surface-secondary py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted transition-colors hover:bg-surface focus:border-primary-400 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary-100/50"
                        data-testid="txt_SidebarSearch"
                    />
                </div>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 overflow-y-auto">
                <div
                    v-for="section in filteredSections"
                    :key="section.label"
                    class="mb-4"
                >
                    <!-- Section Label -->
                    <p
                        v-if="!sidebarCollapsed"
                        class="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted"
                    >
                        {{ section.label }}
                    </p>
                    <div v-else class="mx-auto mb-1 h-px w-8 bg-border"></div>

                    <div class="space-y-0.5">
                        <div v-for="item in section.items" :key="item.id">
                            <!-- Single item (no children) -->
                            <RouterLink
                                v-if="!item.children.length"
                                :id="toObjectId('trm_Sidebar', item.title)"
                                :to="item.path ?? '#'"
                                class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
                                :class="[
                                    sidebarCollapsed
                                        ? 'justify-center gap-0'
                                        : 'gap-3 justify-start',
                                    item.path && isActive(item.path)
                                        ? 'bg-primary-50 text-primary-600 font-medium'
                                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text',
                                ]"
                                :title="
                                    sidebarCollapsed ? item.title : undefined
                                "
                                :data-testid="
                                    toObjectId('trm_Sidebar', item.title)
                                "
                                @click="closeOnNavigate"
                            >
                                <Icon
                                    :icon="item.icon"
                                    :size="18"
                                    :class-name="
                                        item.path && isActive(item.path)
                                            ? 'text-primary-600'
                                            : 'text-text-muted group-hover:text-text'
                                    "
                                />
                                <span v-if="!sidebarCollapsed">{{
                                    item.title
                                }}</span>
                            </RouterLink>

                            <!-- Group with children -->
                            <div v-else>
                                <button
                                    :id="
                                        toObjectId(
                                            'trm_SidebarGroup',
                                            item.title,
                                        )
                                    "
                                    type="button"
                                    class="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-text"
                                    :class="
                                        sidebarCollapsed
                                            ? 'justify-center'
                                            : 'justify-between'
                                    "
                                    :title="
                                        sidebarCollapsed
                                            ? item.title
                                            : undefined
                                    "
                                    :data-testid="
                                        toObjectId(
                                            'trm_SidebarGroup',
                                            item.title,
                                        )
                                    "
                                    @click="toggleGroup(item.id)"
                                >
                                    <div
                                        class="flex items-center"
                                        :class="
                                            sidebarCollapsed ? 'gap-0' : 'gap-3'
                                        "
                                    >
                                        <Icon
                                            :icon="item.icon"
                                            :size="18"
                                            class-name="text-text-muted group-hover:text-text"
                                        />
                                        <span v-if="!sidebarCollapsed">{{
                                            item.title
                                        }}</span>
                                    </div>
                                    <Icon
                                        v-if="!sidebarCollapsed"
                                        :icon="
                                            isGroupOpen(item.id)
                                                ? ChevronDown
                                                : ChevronRight
                                        "
                                        :size="16"
                                        class-name="text-text-muted group-hover:text-text"
                                    />
                                </button>

                                <div
                                    v-if="
                                        (isGroupOpen(item.id) || searchQuery) &&
                                        !sidebarCollapsed
                                    "
                                    class="mt-1 space-y-0.5"
                                >
                                    <RouterLink
                                        v-for="child in item.children"
                                        :id="
                                            toObjectId(
                                                'trm_Sidebar',
                                                child.title,
                                            )
                                        "
                                        :key="child.id"
                                        :to="child.path ?? '#'"
                                        class="group flex items-center rounded-md pl-9 pr-3 py-2 text-sm font-medium transition-colors duration-150"
                                        :class="
                                            child.path && isActive(child.path)
                                                ? 'bg-primary-50 text-primary-600 font-medium'
                                                : 'text-text-secondary hover:bg-surface-secondary hover:text-text'
                                        "
                                        :data-testid="
                                            toObjectId(
                                                'trm_Sidebar',
                                                child.title,
                                            )
                                        "
                                        @click="closeOnNavigate"
                                    >
                                        <span>{{ child.title }}</span>
                                    </RouterLink>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Collapse Button -->
            <div class="mt-auto border-t border-border pt-4">
                <button
                    id="btn_SidebarCollapse"
                    type="button"
                    class="flex h-9 w-full items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-text"
                    data-testid="btn_SidebarCollapse"
                    @click="toggleCollapse"
                >
                    <Icon
                        :icon="sidebarCollapsed ? ChevronsRight : ChevronsLeft"
                        :size="18"
                    />
                    <span v-if="!sidebarCollapsed">Collapse</span>
                </button>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AppLogo from "@/assets/image.png";
import Icon from "@/components/atoms/Icon.vue";
import { useTheme } from "@/composable/useTheme";
import { useAccess } from "@/composable/useAccess";
import { toObjectId } from "@/utils/objectId";
import {
    Search,
    LayoutDashboard,
    Database,
    Store,
    FileText,
    ArrowDownToLine,
    ArrowUpFromLine,
    Layers,
    Radio,
    LineChart,
    Sliders,
    Users,
    Map,
    ScrollText,
    ListTodo,
    ChevronDown,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Warehouse,
    MapPin,
    Box,
    Ruler,
    Truck,
} from "lucide-vue-next";
import type { MenuTreeNode } from "@/services/auth.service";
import { isSupportedMasterPath } from "@/views/master/entityConfig";

type SidebarEmit = (event: "close") => void;
type NavItem = {
    id: string;
    code: string;
    title: string;
    path: string | null;
    icon: Component;
    children: NavItem[];
    sortOrder: number;
};

const emit = defineEmits<SidebarEmit>();
const route = useRoute();
const theme = useTheme();
const sidebarCollapsed = computed(() => theme.sidebarCollapsed.value);
const { menuTree } = useAccess();
const openGroups = ref<Record<string, boolean>>({});

const iconMap: Record<string, Component> = {
    DASHBOARD: LayoutDashboard,
    DASHBOARD_OVERVIEW: LayoutDashboard,
    DASHBOARD_LOW_STOCK: Layers,
    DASHBOARD_RECENT_ACTIVITY: ScrollText,
    DASHBOARD_EPC_STATUS: Radio,
    MASTER: Database,
    MASTER_DATA: Database,
    WAREHOUSES: Warehouse,
    LOCATIONS: MapPin,
    PRODUCTS: Box,
    PRODUCT_CATEGORIES: Layers,
    UOMS: Ruler,
    CUSTOMERS: Users,
    SUPPLIERS: Truck,
    TRANSACTIONS: FileText,
    TRANSACTION_REGISTER_TAGS: Radio,
    TRANSACTION_INBOUND: ArrowDownToLine,
    TRANSACTION_OUTBOUND: ArrowUpFromLine,
    TRANSACTION_RELOCATION: Map,
    TRANSACTION_TRANSFER: Truck,
    TRANSACTION_RETURNS: ArrowDownToLine,
    TRANSACTION_OPNAME: FileText,
    STOCK: Layers,
    STOCK_BALANCE: Layers,
    STOCK_LEDGER: ScrollText,
    RFID: Radio,
    RFID_TAGS: Radio,
    RFID_ASSIGNMENTS: FileText,
    RFID_EVENTS: ScrollText,
    REPORTS: LineChart,
    REPORT_STOCK_MOVEMENT: LineChart,
    REPORT_STOCK_BALANCE: LineChart,
    REPORT_INBOUND: ArrowDownToLine,
    REPORT_OUTBOUND: ArrowUpFromLine,
    REPORT_OPNAME_VARIANCE: FileText,
    SETTINGS: Sliders,
    SETTINGS_APPS: Sliders,
    SETTINGS_COMPANIES: Store,
    SETTINGS_MENUS: Sliders,
    USERS: Users,
    LOCATION: MapPin,
    LOG: ScrollText,
    TODO: ListTodo,
    DEFAULT: LayoutDashboard,
};

const getIcon = (code?: string | null) => {
    const normalized = code?.toUpperCase() ?? "DEFAULT";
    return iconMap[normalized] ?? iconMap.DEFAULT;
};

const normalizeSort = (node: MenuTreeNode) =>
    node.sortOrder ?? node.sort_order ?? 0;

const normalizeTitle = (node: MenuTreeNode) => {
    if (node.code === "RFID" || node.code === "TRANSACTION_REGISTER_TAGS") {
        return "Register Tags";
    }
    return node.name;
};

const cloneNavItem = (item: NavItem): NavItem => ({
    ...item,
    children: item.children.map(cloneNavItem),
});

const mergeRegisterTagsIntoTransactions = (items: NavItem[]): NavItem[] => {
    const clonedItems = items.map(cloneNavItem);
    const transactions = clonedItems.find(
        (item) => item.code === "TRANSACTIONS",
    );
    const registerTagsIndex = clonedItems.findIndex(
        (item) =>
            item.code === "RFID" ||
            item.code === "TRANSACTION_REGISTER_TAGS" ||
            item.title === "Register Tags",
    );

    if (!transactions || registerTagsIndex === -1) {
        return clonedItems;
    }

    const registerTags = clonedItems.splice(registerTagsIndex, 1)[0];
    const normalizedRegisterTags: NavItem = {
        ...registerTags,
        code: "TRANSACTION_REGISTER_TAGS",
        title: "Register Tags",
        sortOrder: 0,
    };

    const existingIndex = transactions.children.findIndex(
        (child) =>
            child.code === normalizedRegisterTags.code ||
            child.title === normalizedRegisterTags.title,
    );

    if (existingIndex === -1) {
        transactions.children = [
            normalizedRegisterTags,
            ...transactions.children,
        ].sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return clonedItems;
};

const toNavItem = (node: MenuTreeNode): NavItem | null => {
    if (!node.permissions.canView) {
        return null;
    }

    if (
        node.path &&
        (node.path.startsWith("/master/") ||
            node.path.startsWith("/master-data/")) &&
        !isSupportedMasterPath(node.path)
    ) {
        return null;
    }

    const children = node.children
        .map((child) => toNavItem(child))
        .filter((child): child is NavItem => Boolean(child))
        .sort((a, b) => a.sortOrder - b.sortOrder);

    if (!node.path && !children.length) {
        return null;
    }

    return {
        id: node.id,
        code: node.code ?? "",
        title: normalizeTitle(node),
        path: node.path,
        icon: getIcon(node.code),
        children,
        sortOrder: normalizeSort(node),
    };
};

const navItems = computed<NavItem[]>(() =>
    mergeRegisterTagsIntoTransactions([
        ...menuTree.value
            .map((node) => toNavItem(node))
            .filter((item): item is NavItem => Boolean(item))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        {
            id: "demo-todo-list",
            code: "TODO",
            title: "Todo List",
            path: "/todo",
            icon: getIcon("TODO"),
            children: [],
            sortOrder: 999,
        },
    ]),
);

const searchQuery = ref("");

type SidebarSection = {
    label: string;
    codes: string[];
    items: NavItem[];
};

const sectionDefinitions: { label: string; codes: string[] }[] = [
    {
        label: "Dashboard",
        codes: ["DASHBOARD"],
    },
    {
        label: "Master Data",
        codes: ["MASTER"],
    },
    {
        label: "Transaction",
        codes: ["RFID", "STOCK", "TRANSACTION", "REGISTER"],
    },
    {
        label: "Admin Setting",
        codes: ["SETTING", "USER", "ACCESS"],
    },
];

const classifyItem = (item: NavItem): string | null => {
    const code = item.code.toUpperCase();
    const title = item.title.toUpperCase();
    if (
        code.includes("REPORT") ||
        title.includes("REPORT") ||
        code.includes("LOG") ||
        title.includes("LOG")
    ) {
        return null;
    }
    for (const section of sectionDefinitions) {
        if (section.codes.some((c) => code.includes(c) || title.includes(c))) {
            return section.label;
        }
    }
    return "Other";
};

const navSections = computed<SidebarSection[]>(() => {
    const grouped: Record<string, NavItem[]> = {};
    for (const item of navItems.value) {
        const sectionLabel = classifyItem(item);
        if (!sectionLabel) continue;
        if (!grouped[sectionLabel]) {
            grouped[sectionLabel] = [];
        }
        grouped[sectionLabel].push(item);
    }

    const sections: SidebarSection[] = [];
    for (const def of sectionDefinitions) {
        if (grouped[def.label]?.length) {
            sections.push({
                label: def.label,
                codes: def.codes,
                items: grouped[def.label],
            });
        }
    }
    // Catch any items that didn't match a section
    if (grouped["Other"]?.length) {
        sections.push({
            label: "Other",
            codes: [],
            items: grouped["Other"],
        });
    }
    return sections;
});

const filteredSections = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return navSections.value;

    const filterItem = (item: NavItem): NavItem | null => {
        const matchesQuery = item.title.toLowerCase().includes(query);
        const filteredChildren = item.children
            .map(filterItem)
            .filter((child): child is NavItem => Boolean(child));

        if (matchesQuery || filteredChildren.length > 0) {
            return {
                ...item,
                children: filteredChildren,
            };
        }
        return null;
    };

    return navSections.value
        .map((section) => {
            const items = section.items
                .map(filterItem)
                .filter((item): item is NavItem => Boolean(item));
            return items.length ? { ...section, items } : null;
        })
        .filter((s): s is SidebarSection => Boolean(s));
});

const isActive = (path: string) =>
    route.path === path || route.path.startsWith(`${path}/`);
const closeOnNavigate = () => emit("close");
const toggleCollapse = () => theme.toggleSidebarCollapsed();

const toggleGroup = (id: string) => {
    openGroups.value[id] = !openGroups.value[id];
};

const isGroupOpen = (id: string) => openGroups.value[id] ?? false;

watch(
    navItems,
    (items) => {
        const nextState: Record<string, boolean> = {};
        items.forEach((item) => {
            if (!item.children.length) {
                return;
            }
            const childMatch = item.children.some(
                (child) => child.path && isActive(child.path),
            );
            nextState[item.id] =
                childMatch || openGroups.value[item.id] || false;
        });
        openGroups.value = nextState;
    },
    { immediate: true },
);
</script>
