<template>
    <div
        class="flex h-screen w-full gap-2 overflow-hidden bg-surface p-2 text-text"
        :data-theme="mode"
        :data-density="density"
    >
        <Rail
            class="shrink-0"
            :items="railItems"
            :active-id="activeRailId"
            :preview-items-by-id="railPreviewItemsById"
            :avatar-initials="userInitials"
            :avatar-label="userName"
            :avatar-image-url="avatarUrl"
            @navigate="handleNavigate"
            @profile-settings="handleProfileSettings"
            @logout="handleLogout"
        />

        <transition
            enter-active-class="transition-opacity duration-200 ease-out"
            leave-active-class="transition-opacity duration-200 ease-in"
        >
            <div v-if="ui.sidebarOpen" class="fixed inset-0 z-50 lg:hidden">
                <button
                    type="button"
                    class="absolute inset-0 bg-text/40"
                    aria-label="Close sidebar"
                    @click="ui.closeSidebar"
                />
                <div class="absolute inset-y-0 left-16 z-10 w-[240px]">
                    <Sidebar
                        class="h-full"
                        :scope="activeRailId"
                        @navigate="handleNavigate"
                        @close="ui.closeSidebar"
                    />
                </div>
            </div>
        </transition>

        <section
            class="flex flex-1 min-w-0 overflow-hidden rounded-md border border-border bg-surface"
        >
            <div class="hidden lg:flex lg:shrink-0">
                <Sidebar
                    :scope="activeRailId"
                    @navigate="handleNavigate"
                    @close="ui.closeSidebar"
                />
            </div>

            <div class="flex-1 min-w-0 flex flex-col">
                <Topbar @toggle-sidebar="ui.toggleSidebar" />

                <div
                    id="page-toolbar-slot"
                    class="shrink-0 bg-surface empty:hidden"
                />

                <main class="flex-1 overflow-y-auto bg-surface px-6 py-5">
                    <slot>
                        <router-view />
                    </slot>
                </main>
            </div>
        </section>

        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
    Database,
    FileText,
    LayoutDashboard,
    Radio,
    Settings2,
    Shield,
    Layers,
} from "lucide-vue-next";
import Sidebar from "@/components/organisms/Sidebar.vue";
import Topbar from "@/components/organisms/Topbar.vue";
import Rail, { type RailItem } from "@/components/organisms/Rail.vue";
import {
    buildSidebarNavItems,
    flattenSidebarNavItems,
    type SidebarFlatItem,
    type SidebarScope,
} from "@/components/organisms/sidebarNavigation";
import ToastContainer from "@/components/organisms/ToastContainer.vue";
import { useAccess } from "@/composable/useAccess";
import { useTheme } from "@/composable/useTheme";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useNotifier } from "@/composable/useNotifier";

const ui = useUiStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { menuTree } = useAccess();
const { withToast } = useNotifier();
const { mode, density } = useTheme();
const logoutLoading = ref(false);

const userName = computed(() => authStore.profile?.user.fullName ?? "User");
const avatarUrl = computed(() => authStore.profile?.user.avatarUrl ?? null);
const userInitials = computed(() => {
    const parts = userName.value.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return userName.value.slice(0, 2).toUpperCase();
});

const railItems: RailItem[] = [
    {
        id: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        to: "/dashboard/overview",
    },
    {
        id: "master-data",
        icon: Database,
        label: "Master Data",
        to: "/master-data/warehouses",
    },
    { id: "iam", icon: Shield, label: "IAM", to: "/iam/roles" },
    { id: "rfid", icon: Radio, label: "RFID", to: "/rfid/tags" },
    { id: "stock", icon: Layers, label: "Stock", to: "/stock/balance" },
    {
        id: "transactions",
        icon: FileText,
        label: "Transactions",
        to: "/transactions/inbound",
    },
    {
        id: "settings",
        icon: Settings2,
        label: "Settings",
        to: "/settings/companies",
    },
];

const activeRailId = computed<SidebarScope>(() => {
    const topLevelSegment = route.path.split("/").filter(Boolean)[0] ?? "";
    const sectionMatch = railItems.find((item) => item.id === topLevelSegment);
    if (sectionMatch) return sectionMatch.id as SidebarScope;

    const matchedRecords = [...route.matched].reverse();
    const matchedMasterData = matchedRecords.some((record) => {
        const path = String(record.path ?? "");
        return (
            path === "master-data" ||
            path.startsWith("master-data/") ||
            Boolean(
                (record.meta as Record<string, unknown> | undefined)?.entity,
            )
        );
    });
    if (matchedMasterData) return "master-data";

    const matchedDashboard = matchedRecords.some((record) => {
        const path = String(record.path ?? "");
        return (
            path === "dashboard" ||
            path.startsWith("dashboard/") ||
            Boolean(
                (record.meta as Record<string, unknown> | undefined)?.section,
            )
        );
    });
    if (matchedDashboard) return "dashboard";

    const currentPath = route.path.replace(/\/+$/, "");
    const match = railItems.find((item) => {
        const base = item.to.replace(/\/+$/, "");
        return currentPath === base || currentPath.startsWith(`${base}/`);
    });
    return (match?.id as SidebarScope | undefined) ?? "dashboard";
});

const railScopeMap: Record<Exclude<SidebarScope, "all">, SidebarScope> = {
    dashboard: "dashboard",
    "master-data": "master-data",
    iam: "iam",
    rfid: "rfid",
    stock: "stock",
    transactions: "transactions",
    settings: "settings",
};

const railPreviewItemsById = computed<Record<string, SidebarFlatItem[]>>(() => {
    const previewEntries = Object.entries(railScopeMap).map(
        ([railId, scope]) => {
            const items = flattenSidebarNavItems(
                buildSidebarNavItems(menuTree.value, scope),
            );
            return [railId, items] as const;
        },
    );

    return Object.fromEntries(previewEntries);
});

const handleNavigate = ({ to }: { to: string }) => {
    ui.closeSidebar();
    if (route.path !== to) {
        void router.push(to);
    }
};

const handleProfileSettings = () => {
    handleNavigate({ to: "/profile" });
};

const handleLogout = async () => {
    if (logoutLoading.value) return;

    try {
        await withToast(() => authStore.logout(), {
            loadingRef: logoutLoading,
            successMessage: "Kamu telah keluar dari sesi.",
            errorMessage: "Logout gagal. Coba lagi nanti.",
        });
        await router.replace("/login");
    } catch {
        // toast helper handles the failure message
    }
};

// Theme reactivity stays centralized in the shared composable; AppLayout only forwards the attributes.

watch(
    () => route.fullPath,
    () => {
        ui.closeSidebar();
    },
);
</script>
