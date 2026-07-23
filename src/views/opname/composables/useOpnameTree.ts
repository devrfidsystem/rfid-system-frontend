import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth.store";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import {
    opnameService,
    type OpnameTreeFilterParams,
} from "@/services/opname.service";
import {
    flattenOpnameTree,
    normalizeOpnameTree,
    type OpnameNodeType,
    type OpnameTreeNode,
} from "../opnameTree";

export function useOpnameTree() {
    const router = useRouter();
    const authStore = useAuthStore();
    const warehouseState = useWarehouseOptions();

    const loading = ref(false);
    const error = ref<string | null>(null);
    const keyword = ref("");
    const startDate = ref("");
    const endDate = ref("");
    const statusFilter = ref("");
    const locationFilter = ref("");
    const selectedWarehouseId = ref("");
    const tree = ref<OpnameTreeNode[]>([]);
    const expandedIds = ref<Set<string>>(new Set());
    const isDetailOpen = ref(false);
    const selectedNode = ref<OpnameTreeNode | null>(null);

    const companyId = computed(() => authStore.currentCompanyId ?? "");

    const warehouseOptions = computed(() =>
        warehouseState.options.value.map((warehouse) => ({
            label: `${warehouse.code} - ${warehouse.name}`,
            value: String(warehouse.id),
        })),
    );

    const selectedWarehouseLabel = computed(() => {
        const found = warehouseOptions.value.find(
            (option) => option.value === selectedWarehouseId.value,
        );
        return found?.label ?? "Select warehouse";
    });

    const sectionHeading = computed(() => "Stock Opname Group");

    const filteredTree = computed(() => {
        const keywordLower = keyword.value.trim().toLowerCase();
        const statusLower = statusFilter.value.trim().toLowerCase();
        const locationLower = locationFilter.value.trim().toLowerCase();
        const startTime = startDate.value
            ? new Date(startDate.value).getTime()
            : null;
        const endTime = endDate.value
            ? new Date(endDate.value).getTime()
            : null;

        const matches = (node: OpnameTreeNode) => {
            const createdAtTime = node.createdAt
                ? new Date(node.createdAt).getTime()
                : null;
            const fields = [
                node.title,
                node.profile_id,
                node.status,
                node.nodeType,
                node.task_group ?? "",
                node.task_period ?? "",
                node.description ?? "",
            ]
                .join(" ")
                .toLowerCase();

            const keywordOk = !keywordLower || fields.includes(keywordLower);
            const statusOk =
                !statusLower || node.status.toLowerCase().includes(statusLower);
            const locationOk =
                !locationLower ||
                [node.task_group, node.task_period, node.description]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(locationLower);
            const dateOk =
                (!startTime || !createdAtTime || createdAtTime >= startTime) &&
                (!endTime ||
                    !createdAtTime ||
                    createdAtTime <= endTime + 86400000 - 1);
            return keywordOk && statusOk && locationOk && dateOk;
        };

        const filterNode = (node: OpnameTreeNode): OpnameTreeNode | null => {
            const children = (node.children ?? [])
                .map(filterNode)
                .filter((child): child is OpnameTreeNode => Boolean(child));
            if (matches(node) || children.length > 0) {
                return {
                    ...node,
                    children,
                };
            }
            return null;
        };

        return tree.value
            .map(filterNode)
            .filter((node): node is OpnameTreeNode => Boolean(node));
    });

    const visibleRows = computed(() =>
        flattenOpnameTree(
            normalizeOpnameTree(filteredTree.value),
            expandedIds.value,
        ),
    );

    const emptyStateVariant = computed<"default" | "search" | "filter">(() => {
        if (keyword.value.trim()) return "search";
        if (
            statusFilter.value.trim() ||
            locationFilter.value.trim() ||
            startDate.value ||
            endDate.value
        ) {
            return "filter";
        }
        return "default";
    });

    const loadTree = async () => {
        if (!companyId.value || !selectedWarehouseId.value) {
            tree.value = [];
            expandedIds.value = new Set();
            return;
        }

        loading.value = true;
        error.value = null;
        try {
            const params: OpnameTreeFilterParams = {
                companyId: companyId.value,
                warehouseId: selectedWarehouseId.value,
            };
            const rows = await opnameService.getTree(params);
            tree.value = rows;
            expandedIds.value = new Set(rows.map((row) => row.id));
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to load opname tree.";
        } finally {
            loading.value = false;
        }
    };

    const refresh = async () => {
        await loadTree();
    };

    watch(
        () => warehouseState.options.value,
        (options) => {
            if (!selectedWarehouseId.value && options.length) {
                selectedWarehouseId.value = String(options[0]?.id ?? "");
            }
        },
        { immediate: true },
    );

    watch(
        [companyId, selectedWarehouseId],
        ([nextCompanyId, nextWarehouseId]) => {
            if (!nextCompanyId || !nextWarehouseId) {
                tree.value = [];
                expandedIds.value = new Set();
                return;
            }
            void loadTree();
        },
        { immediate: true },
    );

    const openCreateRoot = () => {
        void router.push({
            path: "/transactions/opname/new",
            query: {
                mode: "group",
                warehouseId: selectedWarehouseId.value || undefined,
            },
        });
    };

    const openCreateChild = (
        parent: OpnameTreeNode,
        nodeType: Exclude<OpnameNodeType, "group">,
    ) => {
        expandedIds.value = new Set([...expandedIds.value, parent.id]);
        void router.push({
            path: "/transactions/opname/new",
            query: {
                mode: nodeType,
                parentId: parent.id,
                warehouseId: String(
                    parent.warehouse_id ?? selectedWarehouseId.value,
                ),
            },
        });
    };

    const openDetail = (node: OpnameTreeNode) => {
        void router.push({
            path: `/transactions/opname/${node.id}`,
            query: {
                warehouseId:
                    selectedWarehouseId.value ||
                    String(node.warehouse_id ?? ""),
            },
        });
    };

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds.value);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        expandedIds.value = next;
    };

    return {
        loading,
        error,
        keyword,
        startDate,
        endDate,
        statusFilter,
        locationFilter,
        emptyStateVariant,
        selectedWarehouseId,
        warehouseOptions,
        selectedWarehouseLabel,
        sectionHeading,
        rows: visibleRows,
        loadTree,
        refresh,
        openCreateRoot,
        openCreateChild,
        openDetail,
        toggleExpand,
    };
}
