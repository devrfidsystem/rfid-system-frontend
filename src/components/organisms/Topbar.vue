<template>
    <header class="sticky top-0 z-30 h-[60px] bg-surface">
        <div class="flex h-full items-center justify-between px-6">
            <div class="flex min-w-0 items-center gap-2">
                <button
                    type="button"
                    class="inline-flex h-[var(--control-h-sm)] w-[var(--control-h-sm)] items-center justify-center rounded-md text-text-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 lg:hidden"
                    aria-label="Open sidebar"
                    @click="emit('toggle-sidebar')"
                >
                    <Menu class="h-[18px] w-[18px]" :stroke-width="1.75" />
                </button>

                <nav
                    class="min-w-0 overflow-hidden text-sm text-text-secondary"
                    aria-label="Breadcrumb"
                >
                    <ol
                        class="flex min-w-0 items-center gap-2 whitespace-nowrap"
                    >
                        <li
                            v-for="(item, index) in breadcrumbItems"
                            :key="item.label"
                            class="flex min-w-0 items-center gap-2"
                        >
                            <span
                                class="truncate"
                                :class="
                                    item.active
                                        ? 'font-medium text-text'
                                        : 'text-text-secondary'
                                "
                            >
                                {{ item.label }}
                            </span>
                            <span
                                v-if="index < breadcrumbItems.length - 1"
                                class="text-text-muted"
                            >
                                >
                            </span>
                        </li>
                    </ol>
                </nav>
            </div>

            <div class="flex items-center gap-2">
                <div ref="warehouseMenuRef" class="relative hidden md:block">
                    <button
                        type="button"
                        class="flex h-[var(--control-h-md)] min-w-[220px] items-center justify-between gap-4 rounded-md border border-border bg-surface px-3 text-left transition-colors duration-150 hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        aria-haspopup="listbox"
                        :aria-expanded="isWarehouseMenuOpen"
                        @click="toggleWarehouseMenu"
                    >
                        <div class="min-w-0">
                            <div
                                class="text-xs font-semibold uppercase tracking-wide text-text-muted"
                            >
                                Warehouse
                            </div>
                            <div class="truncate text-sm font-medium text-text">
                                {{ currentWarehouseLabel }}
                            </div>
                        </div>
                        <ChevronDown
                            class="h-4 w-4 shrink-0 text-text-muted transition-transform"
                            :class="isWarehouseMenuOpen ? 'rotate-180' : ''"
                            :stroke-width="1.75"
                        />
                    </button>

                    <div
                        v-if="isWarehouseMenuOpen"
                        class="absolute right-0 top-[calc(100%+8px)] z-40 w-full overflow-hidden rounded-md border border-border bg-surface shadow-lg"
                        role="listbox"
                    >
                        <button
                            v-for="warehouse in warehouses"
                            :key="warehouse.id"
                            type="button"
                            class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface-secondary"
                            :class="
                                warehouse.id === currentWarehouseId
                                    ? 'bg-surface-secondary font-medium text-text'
                                    : 'text-text'
                            "
                            @click="selectWarehouse(warehouse.id)"
                        >
                            <span class="truncate">{{ warehouse.name }}</span>
                            <span
                                v-if="warehouse.id === currentWarehouseId"
                                class="text-xs text-text-muted"
                            >
                                Active
                            </span>
                        </button>

                        <div
                            v-if="!warehouses.length"
                            class="px-3 py-2 text-sm text-text-muted"
                        >
                            No warehouse available
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    class="relative inline-flex h-[var(--control-h-sm)] w-[var(--control-h-sm)] items-center justify-center rounded-md text-text-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    aria-label="Notifications"
                    @click="isNotificationOpen = true"
                >
                    <Bell class="h-[18px] w-[18px]" :stroke-width="1.75" />
                    <span
                        v-if="hasUnreadNotifications"
                        class="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </div>

        <NotificationDrawer
            v-model:is-open="isNotificationOpen"
            @close="isNotificationOpen = false"
        />
    </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Bell, ChevronDown, Menu } from "lucide-vue-next";
import NotificationDrawer from "@/components/organisms/NotificationDrawer.vue";
import { useAuthStore } from "@/store/auth.store";
import { useWarehouseStore } from "@/store/warehouse.store";

const emit = defineEmits<{
    (e: "toggle-sidebar"): void;
}>();

const route = useRoute();
const authStore = useAuthStore();
const warehouseStore = useWarehouseStore();
const isNotificationOpen = ref(false);
const isWarehouseMenuOpen = ref(false);
const warehouseMenuRef = ref<HTMLElement | null>(null);
const hasUnreadNotifications = true;

const warehouses = computed(() => authStore.profile?.warehouses ?? []);
const currentWarehouseId = computed(
    () => warehouseStore.selectedWarehouseId ?? "",
);
const currentWarehouseLabel = computed(() => {
    const activeWarehouse = warehouses.value.find(
        (warehouse) => warehouse.id === currentWarehouseId.value,
    );
    return activeWarehouse?.name ?? "Select Warehouse";
});

watch(
    warehouses,
    (options) => {
        warehouseStore.syncWarehouseSelection(
            options.map((warehouse) => warehouse.id),
        );
    },
    { immediate: true },
);

const selectWarehouse = (warehouseId: string) => {
    warehouseStore.setWarehouse(warehouseId);
    isWarehouseMenuOpen.value = false;
};

const toggleWarehouseMenu = () => {
    if (!warehouses.value.length) {
        return;
    }
    isWarehouseMenuOpen.value = !isWarehouseMenuOpen.value;
};

const closeWarehouseMenu = (event: MouseEvent) => {
    if (
        warehouseMenuRef.value &&
        !warehouseMenuRef.value.contains(event.target as Node)
    ) {
        isWarehouseMenuOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", closeWarehouseMenu);
});

onUnmounted(() => {
    document.removeEventListener("click", closeWarehouseMenu);
});

watch(
    warehouses,
    () => {
        if (!warehouses.value.length) {
            isWarehouseMenuOpen.value = false;
        }
    },
    { immediate: true },
);

const formatSegment = (segment: string) => {
    const specialCases: Record<string, string> = {
        "master-data": "Master Data",
        dashboard: "Dashboard",
        iam: "IAM",
        "product-categories": "Product Categories",
        uoms: "UOMs",
    };

    const normalized = segment.toLowerCase();
    if (specialCases[normalized]) {
        return specialCases[normalized];
    }

    return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const breadcrumbItems = computed(() => {
    const segments = route.path.split("/").filter(Boolean);
    const items = [{ label: "Command Center", active: segments.length === 0 }];

    // "rfid/tags" is a single "Register" menu leaf, not two nested levels.
    const collapsedSegments =
        segments[0] === "rfid" && segments[1] === "tags"
            ? ["register", ...segments.slice(2)]
            : segments;

    collapsedSegments.forEach((segment, index) => {
        items.push({
            label: segment === "register" ? "Register" : formatSegment(segment),
            active: index === collapsedSegments.length - 1,
        });
    });

    return items;
});
</script>
