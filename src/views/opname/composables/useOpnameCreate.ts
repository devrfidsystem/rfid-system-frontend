import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth.store";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useNotifier } from "@/composable/useNotifier";
import {
    opnameService,
    type OpnameNodePayload,
} from "@/services/opname.service";
import type { OpnameNodeType, OpnameTreeNode } from "../opnameTree";

type CreateMode = OpnameNodeType;

type NodeFormState = {
    title: string;
    docNumber: string;
    notes: string;
};

const defaultDocNumber = () => `OP-${Date.now()}`;

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

export function useOpnameCreate() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const { notifyError, notifySuccess } = useNotifier();
    const warehouseState = useWarehouseOptions();

    const submitting = ref(false);
    const loadingContext = ref(false);
    const error = ref<string | null>(null);
    const tree = ref<OpnameTreeNode[]>([]);
    const selectedWarehouseId = ref("");
    const formState = reactive<NodeFormState>({
        title: "",
        docNumber: defaultDocNumber(),
        notes: "",
    });

    const companyId = computed(() => authStore.currentCompanyId ?? "");

    const mode = computed<CreateMode>(() => {
        const value = String(route.query.mode ?? "group");
        if (value === "profile" || value === "task") return value;
        return "group";
    });

    const parentId = computed(() => {
        const value = route.query.parentId;
        return typeof value === "string" && value.trim() ? value : "";
    });

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

    const selectedParent = computed(() => {
        if (!parentId.value) return null;
        return findNode(tree.value, parentId.value);
    });

    const pageTitle = computed(() => "Create Stock Opname");
    const pageDescription = computed(() => {
        if (mode.value === "profile") {
            return "Create a stock opname profile under an existing branch.";
        }
        if (mode.value === "task") {
            return "Create a stock opname task for mobile execution.";
        }
        return "Create a stock opname group.";
    });
    const sectionHeading = computed(() => {
        if (mode.value === "profile") return "Profile Details";
        if (mode.value === "task") return "Task Details";
        return "Group Details";
    });
    const summaryHeading = computed(() => {
        if (mode.value === "profile") return "Stock Opname Profile";
        if (mode.value === "task") return "Stock Opname Task";
        return "Stock Opname Group";
    });
    const titleLabel = computed(() => {
        if (mode.value === "profile") return "Profile Name";
        if (mode.value === "task") return "Task Name";
        return "Group Name";
    });
    const titlePlaceholder = computed(() => {
        if (mode.value === "profile") return "Enter profile name";
        if (mode.value === "task") return "Enter task name";
        return "Enter group name";
    });
    const parentLabel = computed(() => selectedParent.value?.title ?? "-");
    const primaryActionLabel = computed(() => "Create");

    const loadContext = async () => {
        if (!companyId.value || !selectedWarehouseId.value) {
            tree.value = [];
            return;
        }

        loadingContext.value = true;
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
                    : "Failed to load opname context.";
        } finally {
            loadingContext.value = false;
        }
    };

    watch(
        () => warehouseState.options.value,
        (options) => {
            if (!selectedWarehouseId.value && options.length) {
                const queryWarehouse = route.query.warehouseId;
                const resolvedWarehouseId =
                    typeof queryWarehouse === "string" && queryWarehouse.trim()
                        ? queryWarehouse
                        : String(options[0]?.id ?? "");
                selectedWarehouseId.value = resolvedWarehouseId;
            }
        },
        { immediate: true },
    );

    watch(
        [companyId, selectedWarehouseId],
        ([nextCompanyId, nextWarehouseId]) => {
            if (!nextCompanyId || !nextWarehouseId) {
                tree.value = [];
                return;
            }
            void loadContext();
        },
        { immediate: true },
    );

    const handleBack = () => {
        router.push("/transactions/opname");
    };

    const saveNode = async () => {
        if (!companyId.value || !selectedWarehouseId.value) {
            notifyError("Pilih company dan warehouse terlebih dahulu.");
            return;
        }
        if (!formState.title.trim() || !formState.docNumber.trim()) {
            notifyError("Title dan Document Number wajib diisi.");
            return;
        }
        if (mode.value !== "group" && !parentId.value) {
            notifyError("Parent wajib dipilih untuk profile dan task.");
            return;
        }

        submitting.value = true;
        try {
            const payload: OpnameNodePayload = {
                companyId: companyId.value,
                warehouseId: selectedWarehouseId.value,
                docNumber: formState.docNumber.trim(),
                title: formState.title.trim(),
                notes: formState.notes.trim() || undefined,
                parentId: parentId.value || null,
                nodeType: mode.value,
            };

            if (parentId.value) {
                await opnameService.createChild(parentId.value, payload);
            } else {
                await opnameService.create(payload);
            }

            notifySuccess("Opname node created");
            router.push("/transactions/opname");
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to save opname node.",
            );
        } finally {
            submitting.value = false;
        }
    };

    return {
        error,
        loadingContext,
        submitting,
        formState,
        mode,
        pageTitle,
        pageDescription,
        sectionHeading,
        summaryHeading,
        titleLabel,
        titlePlaceholder,
        parentLabel,
        primaryActionLabel,
        warehouseOptions,
        selectedWarehouseId,
        selectedWarehouseLabel,
        selectedParent,
        handleBack,
        saveNode,
        loadContext,
    };
}
