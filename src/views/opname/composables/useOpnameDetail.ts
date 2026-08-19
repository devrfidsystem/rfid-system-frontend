import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth.store";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useNotifier } from "@/composable/useNotifier";
import { opnameService } from "@/services/opname.service";
import type { OpnameLineDetail } from "@/api/feature/opname.api";
import type { OpnameTreeNode } from "../opnameTree";

type OpnameItemAction = "match" | "unmatch";

type OpnameActionForm = {
    expectedQty: string;
    actualQty: string;
    reason: string;
    note: string;
};

const findNode = (
    nodes: OpnameTreeNode[],
    id: string,
): OpnameTreeNode | null => {
    for (const node of nodes) {
        if (node.id === id) return node;
        const match = findNode(node.children ?? [], id);
        if (match) return match;
    }
    return null;
};

const getStatusLabel = (value: string) => {
    if (value === "counting") return "On Going";
    if (value === "reconciled") return "Reconciled";
    if (value === "closed") return "Closed";
    if (value === "canceled") return "Canceled";
    return "Draft";
};

const getStatusTone = (value: string) => {
    if (value === "counting") return "warning";
    if (value === "reconciled") return "info";
    if (value === "closed") return "success";
    if (value === "canceled") return "error";
    return "neutral";
};

type OpnameDocAction = "start-counting" | "reconcile" | "close" | "cancel";

type OpnameDocConfirmationState = {
    action: OpnameDocAction;
    title: string;
    description: string;
    confirmText: string;
    variant: "primary" | "danger";
};

export function useOpnameDetail() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const { notifySuccess, notifyError } = useNotifier();
    const companyId = computed(() => authStore.currentCompanyId ?? "");
    const warehouseState = useWarehouseOptions(companyId);

    const loading = ref(false);
    const error = ref<string | null>(null);
    const tree = ref<OpnameTreeNode[]>([]);
    const detail = ref<{ id: string; lines?: OpnameLineDetail[] } | null>(null);
    const selectedWarehouseId = ref("");
    const isItemDrawerOpen = ref(false);
    const selectedLineItem = ref<OpnameLineDetail | null>(null);
    const selectedItemAction = ref<OpnameItemAction>("match");
    const submittingItemAction = ref(false);
    const docActionLoading = ref(false);
    const docConfirmation = ref<OpnameDocConfirmationState | null>(null);
    const actionForm = ref<Record<OpnameItemAction, OpnameActionForm>>({
        match: {
            expectedQty: "",
            actualQty: "",
            reason: "",
            note: "",
        },
        unmatch: {
            expectedQty: "",
            actualQty: "",
            reason: "",
            note: "",
        },
    });

    const opnameId = computed(() => String(route.params.id ?? ""));

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

    const selectedNode = computed(() => findNode(tree.value, opnameId.value));
    const selectedDetailLines = computed(() => detail.value?.lines ?? []);

    // Only "task" nodes are real OpnameDoc records with a start-counting ->
    // counting -> reconciled -> closed lifecycle; group/profile nodes are
    // purely organizational and never transition through these statuses.
    const isTaskNode = computed(() => selectedNode.value?.nodeType === "task");
    const canStartCounting = computed(
        () => isTaskNode.value && selectedNode.value?.status === "draft",
    );
    const canReconcile = computed(
        () => isTaskNode.value && selectedNode.value?.status === "counting",
    );
    const canClose = computed(
        () => isTaskNode.value && selectedNode.value?.status === "reconciled",
    );
    const canCancelDoc = computed(
        () =>
            isTaskNode.value &&
            (selectedNode.value?.status === "draft" ||
                selectedNode.value?.status === "counting"),
    );

    const drawerActions: Array<{
        key: OpnameItemAction;
        label: string;
        tone: "primary" | "outline";
        description: string;
    }> = [
        {
            key: "match",
            label: "Match",
            tone: "primary",
            description: "Mark the line as matched with the counted stock.",
        },
        {
            key: "unmatch",
            label: "Unmatch",
            tone: "outline",
            description: "Flag the line as not matching the current count.",
        },
    ];

    const selectedItemActionLabel = computed(() => {
        const found = drawerActions.find(
            (action) => action.key === selectedItemAction.value,
        );
        return found?.label ?? "Match";
    });

    const selectedItemActionDescription = computed(() => {
        const found = drawerActions.find(
            (action) => action.key === selectedItemAction.value,
        );
        return (
            found?.description ?? "Select an action for the current line item."
        );
    });

    const selectedItemActionSupported = computed(() =>
        drawerActions.some((action) => action.key === selectedItemAction.value),
    );

    const selectedItemActionHint = computed(() => {
        return "This action writes to the backend line-count endpoint.";
    });

    const selectedLineItemLocation = computed(() => {
        if (!selectedLineItem.value) return "-";
        return (
            selectedLineItem.value.location?.name ??
            selectedLineItem.value.location?.code ??
            selectedLineItem.value.locationId ??
            "-"
        );
    });

    const pageTitle = computed(() => "Opname Detail");
    const pageDescription = computed(() => {
        const nodeType = selectedNode.value?.nodeType ?? "opname";
        return `Read-only detail for the selected ${nodeType} node and its child nodes.`;
    });

    const selectedNodeLocation = computed(() => {
        if (!selectedNode.value) return "-";
        const parts = [
            selectedNode.value.task_group,
            selectedNode.value.task_period,
            selectedNode.value.description,
        ]
            .filter(Boolean)
            .map(String);
        return parts.length ? parts.join(" · ") : "-";
    });

    const loadTree = async () => {
        if (!companyId.value || !selectedWarehouseId.value) {
            tree.value = [];
            return;
        }

        loading.value = true;
        error.value = null;
        try {
            tree.value = await opnameService.getTree({
                companyId: companyId.value,
                warehouseId: selectedWarehouseId.value,
            });
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to load opname detail.";
        } finally {
            loading.value = false;
        }
    };

    const loadDetail = async () => {
        if (!companyId.value || !selectedWarehouseId.value || !opnameId.value) {
            detail.value = null;
            return;
        }

        try {
            detail.value = await opnameService.getDetail(opnameId.value);
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to load opname detail.";
        }
    };

    watch(
        () => warehouseState.options.value,
        (options) => {
            if (!selectedWarehouseId.value && options.length) {
                const queryWarehouse = route.query.warehouseId;
                selectedWarehouseId.value =
                    typeof queryWarehouse === "string" && queryWarehouse.trim()
                        ? queryWarehouse
                        : String(options[0]?.id ?? "");
            }
        },
        { immediate: true },
    );

    watch(
        [companyId, selectedWarehouseId],
        ([nextCompanyId, nextWarehouseId]) => {
            if (!nextCompanyId || !nextWarehouseId) {
                tree.value = [];
                detail.value = null;
                return;
            }
            void loadTree();
            void loadDetail();
        },
        { immediate: true },
    );

    const handleBack = () => {
        router.push("/transactions/opname");
    };

    const openChildCreate = (mode: "profile" | "task") => {
        if (!selectedNode.value) return;
        void router.push({
            path: "/transactions/opname/new",
            query: {
                mode,
                parentId: selectedNode.value.id,
                warehouseId: selectedWarehouseId.value,
            },
        });
    };

    const openDetail = (line: OpnameLineDetail) => {
        selectedLineItem.value = line;
        selectedItemAction.value = "match";
        isItemDrawerOpen.value = true;
    };

    const closeItemDrawer = () => {
        isItemDrawerOpen.value = false;
    };

    const selectItemAction = (action: OpnameItemAction) => {
        selectedItemAction.value = action;
    };

    const buildNotes = () => {
        const note = activeActionForm.value.note.trim();
        const reason = activeActionForm.value.reason.trim();
        const parts = [
            selectedItemActionLabel.value,
            reason ? `Reason: ${reason}` : "",
            note ? `Note: ${note}` : "",
        ].filter(Boolean);
        return parts.join(" | ");
    };

    const resolveQtyCounted = () => {
        const active = activeActionForm.value;
        const fallback =
            selectedLineItem.value?.qtyCounted ??
            selectedLineItem.value?.qtySystem ??
            0;
        if (selectedItemAction.value === "match") {
            const raw = active.actualQty || active.expectedQty;
            return raw ? Number(raw) : fallback;
        }
        if (selectedItemAction.value === "unmatch") {
            const raw = active.actualQty || active.expectedQty;
            return raw ? Number(raw) : fallback;
        }
        return fallback;
    };

    const submitItemAction = async () => {
        if (!selectedLineItem.value) return;
        if (!selectedItemActionSupported.value) {
            return;
        }
        submittingItemAction.value = true;
        try {
            await opnameService.updateLineCount(
                opnameId.value,
                selectedLineItem.value.id,
                {
                    qtyCounted: resolveQtyCounted(),
                    notes: buildNotes(),
                },
            );
            notifySuccess(
                `${selectedItemActionLabel.value} saved for ${selectedLineItem.value.product?.name ?? selectedLineItem.value.productId}.`,
            );
            await loadDetail();
            closeItemDrawer();
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : "Failed to submit opname line action.";
        } finally {
            submittingItemAction.value = false;
        }
    };

    const activeActionForm = computed(
        () => actionForm.value[selectedItemAction.value],
    );

    const docActionCopy: Record<
        OpnameDocAction,
        { title: string; description: string; confirmText: string }
    > = {
        "start-counting": {
            title: "Start Counting",
            description:
                "This snapshots current stock balances for this warehouse into opname lines. The document moves from draft to counting.",
            confirmText: "Start Counting",
        },
        reconcile: {
            title: "Reconcile Opname",
            description:
                "This computes variances (counted vs expected) and locks the document for review. No stock is changed yet.",
            confirmText: "Reconcile",
        },
        close: {
            title: "Close Opname",
            description:
                "This creates stock adjustment movements for any variance and permanently closes the document. This cannot be undone.",
            confirmText: "Close",
        },
        cancel: {
            title: "Cancel Opname",
            description:
                "This cancels the opname document. Only draft or counting documents can be canceled.",
            confirmText: "Cancel Opname",
        },
    };

    const openDocConfirmation = (action: OpnameDocAction) => {
        const copy = docActionCopy[action];
        docConfirmation.value = {
            action,
            title: copy.title,
            description: copy.description,
            confirmText: copy.confirmText,
            variant: action === "cancel" ? "danger" : "primary",
        };
    };

    const clearDocConfirmation = () => {
        docConfirmation.value = null;
    };

    const handleStartCounting = () => openDocConfirmation("start-counting");
    const handleReconcile = () => openDocConfirmation("reconcile");
    const handleClose = () => openDocConfirmation("close");
    const handleCancelDoc = () => openDocConfirmation("cancel");

    const handleConfirmDocAction = async () => {
        if (!docConfirmation.value || !selectedNode.value) return;
        const action = docConfirmation.value.action;
        const docId = selectedNode.value.id;
        clearDocConfirmation();
        docActionLoading.value = true;
        try {
            if (action === "start-counting") {
                if (!selectedWarehouseId.value) {
                    throw new Error(
                        "Select a warehouse before starting counting.",
                    );
                }
                await opnameService.startCounting(
                    docId,
                    selectedWarehouseId.value,
                );
            } else if (action === "reconcile") {
                await opnameService.reconcile(docId);
            } else if (action === "close") {
                await opnameService.close(docId);
            } else {
                await opnameService.cancel(docId);
            }
            notifySuccess(`${docActionCopy[action].title} succeeded.`);
            await Promise.all([loadTree(), loadDetail()]);
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : `Failed to run ${docActionCopy[action].title.toLowerCase()}.`,
            );
        } finally {
            docActionLoading.value = false;
        }
    };

    const refresh = async () => {
        await loadTree();
    };

    return {
        loading,
        error,
        selectedWarehouseId,
        warehouseOptions,
        selectedWarehouseLabel,
        pageTitle,
        pageDescription,
        selectedNode,
        selectedDetailLines,
        selectedNodeLocation,
        isItemDrawerOpen,
        selectedLineItem,
        selectedLineItemLocation,
        drawerActions,
        selectedItemAction,
        selectedItemActionLabel,
        selectedItemActionDescription,
        selectedItemActionSupported,
        selectedItemActionHint,
        actionForm,
        activeActionForm,
        submittingItemAction,
        getStatusLabel,
        getStatusTone,
        handleBack,
        openChildCreate,
        openDetail,
        closeItemDrawer,
        selectItemAction,
        submitItemAction,
        refresh,
        docActionLoading,
        docConfirmation,
        canStartCounting,
        canReconcile,
        canClose,
        canCancelDoc,
        handleStartCounting,
        handleReconcile,
        handleClose,
        handleCancelDoc,
        clearDocConfirmation,
        handleConfirmDocAction,
    };
}
