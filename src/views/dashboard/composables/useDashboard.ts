/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { useAuthStore } from "@/store/auth.store";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import {
    Box,
    Zap,
    ArrowDownRight,
    ArrowUpRight,
    ClipboardCheck,
} from "lucide-vue-next";

const dashboardSections = [
    { key: "alerts", heading: "Operations Alert Center" },
    { key: "workflow", heading: "Business Workflow Overview" },
    { key: "kpi", heading: "Executive KPI Snapshot" },
] as const;

export function useDashboard() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const warehouseStore = useWarehouseStore();

    const {
        options: warehouseOptionsRaw,
        loading: warehousesLoading,
        error: warehouseError,
    } = useWarehouseOptions();

    const selectableWarehouses = computed(() => {
        const userWarehouses = authStore.profile?.warehouses ?? [];
        const allowed = new Set(
            userWarehouses.map((warehouse) => warehouse.id),
        );
        if (!allowed.size) {
            return warehouseOptionsRaw.value;
        }
        return warehouseOptionsRaw.value.filter((option) =>
            allowed.has(option.id),
        );
    });

    const warehouseOptions = computed(() => {
        return selectableWarehouses.value.map((wh) => ({
            label: wh.name,
            value: wh.id,
        }));
    });

    const selectedWarehouse = computed(
        () =>
            selectableWarehouses.value.find(
                (option) => option.id === warehouseStore.selectedWarehouseId,
            ) ?? null,
    );

    const normalizedQueryWarehouseId = computed(() => {
        const raw = route.query.warehouse_id;
        if (Array.isArray(raw)) {
            return raw.at(-1) ?? null;
        }
        if (typeof raw === "string" && raw.trim()) {
            return raw;
        }
        return null;
    });

    watch(
        normalizedQueryWarehouseId,
        (queryValue) => {
            if (queryValue === warehouseStore.selectedWarehouseId) {
                return;
            }
            warehouseStore.setWarehouse(queryValue);
        },
        { immediate: true },
    );

    watch(
        () => warehouseStore.selectedWarehouseId,
        (warehouseId) => {
            const current = normalizedQueryWarehouseId.value;
            if (warehouseId === current) {
                return;
            }
            const nextQuery = {
                ...route.query,
                warehouse_id: warehouseId ?? undefined,
            };
            void router.replace({ query: nextQuery });
        },
    );

    watch(
        selectableWarehouses,
        (options) => {
            warehouseStore.syncWarehouseSelection(
                options.map((warehouse) => warehouse.id),
            );
        },
        { immediate: true },
    );

    const section = computed(
        () => (route.meta.section as string) || "overview",
    );

    // Data Refs
    const summaryData = ref<any>(null);
    const heatmapData = ref<any>(null);
    const chartData = ref<any[]>([]);
    const lowStockData = ref<any>(null);
    const epcStatusData = ref<any[]>([]);
    const recentActivityData = ref<any[]>([]);

    // Loading Refs
    const summaryLoading = ref(false);
    const heatmapLoading = ref(false);
    const chartLoading = ref(false);
    const lowStockLoading = ref(false);
    const epcStatusLoading = ref(false);
    const recentActivityLoading = ref(false);

    const dashboardError = ref<string | null>(null);

    const dashboardLoading = computed(
        () =>
            summaryLoading.value ||
            heatmapLoading.value ||
            chartLoading.value ||
            lowStockLoading.value ||
            epcStatusLoading.value ||
            recentActivityLoading.value,
    );

    const refreshDashboard = async () => {
        dashboardError.value = null;
        const filter = {
            warehouseId: warehouseStore.selectedWarehouseId ?? null,
        };

        summaryLoading.value = true;
        dashboardService
            .fetchSummary(filter)
            .then((res) => (summaryData.value = res))
            .catch((err) => (dashboardError.value = err.message))
            .finally(() => (summaryLoading.value = false));

        if (section.value === "overview") {
            heatmapLoading.value = true;
            dashboardService
                .fetchHeatmap(filter)
                .then((res) => (heatmapData.value = res))
                .catch((err) => (dashboardError.value = err.message))
                .finally(() => (heatmapLoading.value = false));

            chartLoading.value = true;
            dashboardService
                .fetchChart(filter)
                .then((res) => (chartData.value = res))
                .catch((err) => (dashboardError.value = err.message))
                .finally(() => (chartLoading.value = false));

            lowStockLoading.value = true;
            dashboardService
                .fetchLowStock(filter)
                .then((res) => (lowStockData.value = res))
                .catch((err) => (dashboardError.value = err.message))
                .finally(() => (lowStockLoading.value = false));
        } else if (section.value === "low-stock") {
            lowStockLoading.value = true;
            dashboardService
                .fetchLowStock(filter)
                .then((res) => (lowStockData.value = res))
                .catch((err) => (dashboardError.value = err.message))
                .finally(() => (lowStockLoading.value = false));
        } else if (section.value === "recent-activity") {
            recentActivityLoading.value = true;
            dashboardService
                .fetchRecentActivity(filter)
                .then((res) => (recentActivityData.value = res))
                .catch((err) => (dashboardError.value = err.message))
                .finally(() => (recentActivityLoading.value = false));
        } else if (section.value === "epc-status") {
            epcStatusLoading.value = true;
            dashboardService
                .fetchEpcStatus(filter)
                .then((res) => (epcStatusData.value = res))
                .catch((err) => (dashboardError.value = err.message))
                .finally(() => (epcStatusLoading.value = false));
        }
    };

    const fetchForSection = (newSection: string) => {
        if (
            newSection === "overview" &&
            !heatmapData.value &&
            !heatmapLoading.value
        ) {
            void refreshDashboard();
        } else if (
            newSection === "low-stock" &&
            !lowStockData.value &&
            !lowStockLoading.value
        ) {
            void refreshDashboard();
        } else if (
            newSection === "recent-activity" &&
            recentActivityData.value.length === 0 &&
            !recentActivityLoading.value
        ) {
            void refreshDashboard();
        } else if (
            newSection === "epc-status" &&
            epcStatusData.value.length === 0 &&
            !epcStatusLoading.value
        ) {
            void refreshDashboard();
        }
    };

    onMounted(() => {
        void refreshDashboard();
    });

    onBeforeRouteUpdate((to) => {
        fetchForSection((to.meta.section as string) || "overview");
    });

    useDebouncedWatch(
        () => warehouseStore.selectedWarehouseId,
        () => {
            void refreshDashboard();
        },
    );

    const heatmapRows = computed(() => heatmapData.value?.rows ?? []);
    const heatmapMax = computed(() => heatmapData.value?.maxQuantity ?? 1);
    const chartBars = computed(() => chartData.value ?? []);
    const lowStockItems = computed(() => lowStockData.value?.items ?? []);
    const totalLowStock = computed(
        () => lowStockData.value?.totalLowStock ?? 0,
    );

    const recentActivity = computed(() => recentActivityData.value ?? []);

    const epcStatusTotal = computed(
        () =>
            (epcStatusData.value ?? []).reduce(
                (acc: number, s: any) => acc + s.count,
                0,
            ) || 0,
    );

    const epcStatusBreakdown = computed(() => {
        if (!epcStatusData.value) return [];
        const statusItems = epcStatusData.value ?? [];
        const total = epcStatusTotal.value || 1;

        const metaMap: Record<
            string,
            {
                title: string;
                desc: string;
                text: string;
                bg: string;
                color: string;
            }
        > = {
            draft: {
                title: "Draft Tags",
                desc: "RFID Tags registered but not assigned to any physical products.",
                text: "text-slate-700",
                bg: "!bg-slate-50/20 !border-slate-200/50 hover:!bg-slate-50/40",
                color: "bg-slate-500",
            },
            available: {
                title: "Available Stock",
                desc: "RFID Tags assigned to products currently in stock and available.",
                text: "text-emerald-700",
                bg: "!bg-emerald-50/20 !border-emerald-200/50 hover:!bg-emerald-50/40",
                color: "bg-emerald-600",
            },
            assigned: {
                title: "Assigned & Dispatched",
                desc: "RFID Tags dispatched or shipped in outbound transits.",
                text: "text-indigo-700",
                bg: "!bg-indigo-50/20 !border-indigo-200/50 hover:!bg-indigo-50/40",
                color: "bg-indigo-600",
            },
        };

        return statusItems.map((item: any) => {
            const key = item.status.toLowerCase();
            const meta = metaMap[key] ?? {
                title: `${item.status.toUpperCase()} Tags`,
                desc: `RFID Tags with ${item.status} status.`,
                text: "text-gray-700",
                bg: "!bg-gray-50/20 !border-gray-200/50 hover:!bg-gray-50/40",
                color: "bg-gray-600",
            };
            const pct = Math.round((item.count / total) * 100);
            return {
                name: item.status.toUpperCase(),
                count: item.count,
                pct,
                ...meta,
            };
        });
    });

    const summaryCards = computed(() => {
        if (!summaryData.value) {
            return [];
        }
        const summary = summaryData.value;
        const warehouseCaption =
            selectedWarehouse.value?.name ?? "Seluruh Gudang";
        const inboundLabel = summary.latestInboundDate ?? "Belum ada data";
        const outboundLabel = summary.latestOutboundDate ?? "Belum ada data";
        return [
            {
                label: "Total Stock",
                value: summary.totalStock,
                caption: warehouseCaption,
                icon: Box,
                theme: "blue",
            },
            {
                label: "EPC Active",
                value: summary.epcActive,
                caption: "Tags monitored",
                icon: Zap,
                theme: "teal",
            },
            {
                label: "Inbound Today",
                value: summary.inboundToday,
                caption: inboundLabel,
                icon: ArrowDownRight,
                theme: "purple",
            },
            {
                label: "Outbound Today",
                value: summary.outboundToday,
                caption: outboundLabel,
                icon: ArrowUpRight,
                theme: "amber",
            },
            {
                label: "Opname Pending",
                value: summary.opnamePending,
                caption: "Scheduled audits",
                icon: ClipboardCheck,
                theme: "red",
            },
        ];
    });

    return {
        dashboardSections,
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        dashboardLoading,
        summaryLoading,
        heatmapLoading,
        chartLoading,
        lowStockLoading,
        epcStatusLoading,
        recentActivityLoading,
        dashboardError,
        refreshDashboard,
        heatmapRows,
        heatmapMax,
        chartBars,
        lowStockItems,
        totalLowStock,
        section,
        recentActivity,
        epcStatusTotal,
        epcStatusBreakdown,
        summaryCards,
        selectedWarehouseId: computed(() => warehouseStore.selectedWarehouseId),
        setSelectedWarehouse: (warehouseId: string | null) =>
            warehouseStore.setWarehouse(warehouseId),
    };
}
