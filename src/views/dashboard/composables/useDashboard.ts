import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDebouncedWatch } from "@/composable/useDebouncedWatch";
import { useWarehouseStore } from "@/store/warehouse.store";
import { dashboardService } from "@/services/dashboard.service";
import { useDashboardWarehouseFilter } from "./useDashboardWarehouseFilter";
import { dashboardRequestCache } from "./dashboardRequestCache";
import type {
    DashboardAlertsResponse,
    DashboardWorkflowOverviewResponse,
    DashboardKpiSnapshotResponse,
    DashboardFilterState,
} from "@/model/dashboard";

const normalizeErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : "Failed to load dashboard data.";

type RefreshDashboardOptions = {
    force?: boolean;
};

export function useDashboard() {
    const route = useRoute();
    const router = useRouter();
    const warehouseStore = useWarehouseStore();

    const {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        selectedWarehouseId,
        setSelectedWarehouse,
    } = useDashboardWarehouseFilter();

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

    // Data + per-widget error state — each Overview widget gets its own error
    // ref so a failed fetch is distinguishable from a genuinely empty result
    // (a shared error ref would make e.g. a failed alerts fetch look
    // identical to "zero alerts" once a later-resolving fetch overwrites it).
    const alertsData = ref<DashboardAlertsResponse | null>(null);
    const workflowData = ref<DashboardWorkflowOverviewResponse | null>(null);
    const kpiSnapshotData = ref<DashboardKpiSnapshotResponse | null>(null);

    const alertsLoading = ref(false);
    const workflowLoading = ref(false);
    const kpiSnapshotLoading = ref(false);

    const alertsError = ref<string | null>(null);
    const workflowError = ref<string | null>(null);
    const kpiSnapshotError = ref<string | null>(null);

    const dashboardLoading = computed(
        () =>
            alertsLoading.value ||
            workflowLoading.value ||
            kpiSnapshotLoading.value,
    );

    const createFilter = (): DashboardFilterState => ({
        warehouseId: warehouseStore.selectedWarehouseId ?? null,
    });

    const createWidgetKey = (widget: string, filter: DashboardFilterState) =>
        [
            "overview",
            widget,
            filter.companyId ?? "current-company",
            filter.warehouseId ?? "all-warehouses",
        ].join(":");

    const loadWidget = async <T>(
        widget: string,
        filter: DashboardFilterState,
        fetcher: () => Promise<T>,
        setData: (data: T) => void,
        setLoading: (loading: boolean) => void,
        setError: (message: string | null) => void,
        options: RefreshDashboardOptions,
    ) => {
        const sequenceScope = `overview:${widget}`;
        const sequence = dashboardRequestCache.nextSequence(sequenceScope);
        setLoading(true);
        setError(null);
        try {
            const result = await dashboardRequestCache.load(
                createWidgetKey(widget, filter),
                fetcher,
                options,
            );
            if (dashboardRequestCache.isLatest(sequenceScope, sequence)) {
                setData(result.data);
            }
        } catch (err) {
            if (dashboardRequestCache.isLatest(sequenceScope, sequence)) {
                setError(normalizeErrorMessage(err));
            }
        } finally {
            if (dashboardRequestCache.isLatest(sequenceScope, sequence)) {
                setLoading(false);
            }
        }
    };

    const refreshDashboard = async (options: RefreshDashboardOptions = {}) => {
        const filter = createFilter();

        await Promise.allSettled([
            loadWidget(
                "alerts",
                filter,
                () => dashboardService.fetchAlerts(filter),
                (res) => (alertsData.value = res),
                (loading) => (alertsLoading.value = loading),
                (message) => (alertsError.value = message),
                options,
            ),
            loadWidget(
                "workflow",
                filter,
                () => dashboardService.fetchWorkflowOverview(filter),
                (res) => (workflowData.value = res),
                (loading) => (workflowLoading.value = loading),
                (message) => (workflowError.value = message),
                options,
            ),
            loadWidget(
                "kpi-snapshot",
                filter,
                () => dashboardService.fetchKpiSnapshot(filter),
                (res) => (kpiSnapshotData.value = res),
                (loading) => (kpiSnapshotLoading.value = loading),
                (message) => (kpiSnapshotError.value = message),
                options,
            ),
        ]);
    };

    onMounted(() => {
        void refreshDashboard();
    });

    useDebouncedWatch(
        () => warehouseStore.selectedWarehouseId,
        () => {
            void refreshDashboard();
        },
    );

    return {
        warehouseOptions,
        warehousesLoading,
        warehouseError,
        dashboardLoading,
        refreshDashboard,
        alertsData,
        alertsLoading,
        alertsError,
        workflowData,
        workflowLoading,
        workflowError,
        kpiSnapshotData,
        kpiSnapshotLoading,
        kpiSnapshotError,
        selectedWarehouseId,
        setSelectedWarehouse,
    };
}
