import { computed, watch, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDashboardFilters } from "@/store/dashboardFilters.store";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useDashboardSnapshot } from "@/composable/useDashboardSnapshot";
import { useAuthStore } from "@/store/auth.store";
import {
    Box,
    Zap,
    ArrowDownRight,
    ArrowUpRight,
    ClipboardCheck,
} from "lucide-vue-next";

export function useDashboard() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const isMounted = ref(false);

    onMounted(() => {
        isMounted.value = true;
    });

    const dashboardFilters = useDashboardFilters();

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
                (option) => option.id === dashboardFilters.filter.warehouseId,
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
            if (queryValue === dashboardFilters.filter.warehouseId) {
                return;
            }
            dashboardFilters.setWarehouse(queryValue);
        },
        { immediate: true },
    );

    watch(
        () => dashboardFilters.filter.warehouseId,
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
            if (options.length === 1 && !dashboardFilters.filter.warehouseId) {
                dashboardFilters.setWarehouse(options[0].id);
            }
        },
        { immediate: true },
    );

    const {
        snapshot,
        loading: dashboardLoading,
        error: dashboardError,
        refresh: refreshDashboard,
    } = useDashboardSnapshot(() => dashboardFilters.filter);

    const heatmapRows = computed(() => snapshot.value?.heatmap.rows ?? []);
    const heatmapMax = computed(() => snapshot.value?.heatmap.maxQuantity ?? 1);
    const chartBars = computed(() => snapshot.value?.chart ?? []);
    const lowStockSummary = computed(() => snapshot.value?.lowStock ?? null);
    const lowStockItems = computed(() => lowStockSummary.value?.items ?? []);
    const totalLowStock = computed(
        () => lowStockSummary.value?.totalLowStock ?? 0,
    );

    const section = computed(
        () => (route.meta.section as string) || "overview",
    );
    const recentActivity = computed(() => snapshot.value?.recentActivity ?? []);

    const epcStatusTotal = computed(
        () =>
            (snapshot.value?.epcStatus ?? []).reduce(
                (acc, s) => acc + s.count,
                0,
            ) || 0,
    );

    const epcStatusBreakdown = computed(() => {
        if (!snapshot.value) return [];
        const statusItems = snapshot.value.epcStatus ?? [];
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

        return statusItems.map((item) => {
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
        if (!snapshot.value) {
            return [];
        }
        const summary = snapshot.value.summary;
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
                iconColorClass: "text-primary-600",
                cardClass: "!bg-blue-100 !border-blue-300",
            },
            {
                label: "EPC Active",
                value: summary.epcActive,
                caption: "Tags monitored",
                icon: Zap,
                iconColorClass: "text-primary-teal",
                cardClass: "!bg-teal-100 !border-teal-300",
            },
            {
                label: "Inbound Today",
                value: summary.inboundToday,
                caption: inboundLabel,
                icon: ArrowDownRight,
                iconColorClass: "text-insight-purple",
                cardClass: "!bg-purple-100 !border-purple-300",
            },
            {
                label: "Outbound Today",
                value: summary.outboundToday,
                caption: outboundLabel,
                icon: ArrowUpRight,
                iconColorClass: "text-action-orange",
                cardClass: "!bg-amber-100 !border-amber-300",
            },
            {
                label: "Opname Pending",
                value: summary.opnamePending,
                caption: "Scheduled audits",
                icon: ClipboardCheck,
                iconColorClass: "text-signal-red",
                cardClass: "!bg-red-100 !border-red-300",
            },
        ];
    });

    return {
        dashboardFilters,
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        dashboardLoading,
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
    };
}
