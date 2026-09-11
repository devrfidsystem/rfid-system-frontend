import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth.store";
import { useWarehouseOptions } from "@/composable/useWarehouseOptions";
import { useNotifier } from "@/composable/useNotifier";
import { normalizePaginationItems } from "@/lib/api/normalizers";
import {
    opnameService,
    type OpnameNodePayload,
} from "@/services/opname.service";
import { locationService } from "@/services/location.service";
import { usersService } from "@/services/users.service";
import type { LocationRecord } from "@/model/entities";
import type { OpnameNodeType, OpnameTreeNode } from "../opnameTree";
import type { LocationPickerLocation } from "../opnameLocationPicker";

type CreateMode = OpnameNodeType;

type NodeFormState = {
    title: string;
    docNumber: string;
    notes: string;
    assignedToId: string;
    assignedAt: string;
    deadlineAt: string;
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
    const companyId = computed(() => authStore.currentCompanyId ?? "");
    const warehouseState = useWarehouseOptions(companyId);

    const submitting = ref(false);
    const loadingContext = ref(false);
    const error = ref<string | null>(null);
    const tree = ref<OpnameTreeNode[]>([]);
    const selectedWarehouseId = ref("");
    const selectedParentId = ref("");
    const formState = reactive<NodeFormState>({
        title: "",
        docNumber: defaultDocNumber(),
        notes: "",
        assignedToId: "",
        assignedAt: "",
        deadlineAt: "",
    });
    const locationIds = ref<string[]>([]);
    const locationOptions = ref<LocationPickerLocation[]>([]);
    const userOptions = ref<{ label: string; value: string }[]>([]);
    const editingId = computed(() => {
        const value = route.query.id;
        return typeof value === "string" && value.trim() ? value : "";
    });
    const isEdit = computed(
        () => Boolean(editingId.value) && mode.value === "task",
    );

    const mode = computed<CreateMode>(() => {
        const value = String(route.query.mode ?? "group");
        if (value === "profile" || value === "task") return value;
        return "group";
    });

    const parentId = computed(() => {
        return selectedParentId.value;
    });

    const routeParentId = computed(() => {
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

    const parentOptions = computed(() => {
        const options: { label: string; value: string }[] = [];
        const walk = (nodes: OpnameTreeNode[]) => {
            nodes.forEach((node) => {
                const nodeType = node.nodeType;
                const canSelect =
                    mode.value === "profile"
                        ? nodeType === "group"
                        : mode.value === "task" &&
                          (nodeType === "group" || nodeType === "profile");
                if (canSelect) {
                    options.push({ label: node.title, value: node.id });
                }
                walk(node.children ?? []);
            });
        };
        walk(tree.value);
        return options;
    });

    const pageTitle = computed(() =>
        isEdit.value ? "Edit Stock Opname Task" : "Create Stock Opname",
    );
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
    const primaryActionLabel = computed(() =>
        isEdit.value ? "Save" : "Create",
    );

    const LOCATION_PAGE_SIZE = 200;

    const loadLocations = async () => {
        if (!selectedWarehouseId.value) {
            locationOptions.value = [];
            return;
        }
        const items: LocationRecord[] = [];
        try {
            let page = 1;
            while (page <= 20) {
                const response = await locationService.list({
                    warehouseId: selectedWarehouseId.value,
                    page,
                    limit: LOCATION_PAGE_SIZE,
                });
                const batch =
                    normalizePaginationItems<LocationRecord>(response);
                items.push(...batch);
                if (batch.length < LOCATION_PAGE_SIZE) break;
                page += 1;
            }
            locationOptions.value = items.map((item) => ({
                id: String(item.id),
                parentId: item.parentId ?? null,
                code: item.code,
                name: item.name,
                epc: item.epc ?? null,
            }));
        } catch (err) {
            locationOptions.value = [];
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to load warehouse locations.",
            );
        }
    };

    const loadUsers = async () => {
        const response = await usersService.list({ limit: 200 });
        userOptions.value = response.items.map((user) => {
            const record = user as { id?: string; fullName?: string };
            return {
                label: String(record.fullName ?? record.id ?? ""),
                value: String(record.id ?? ""),
            };
        });
    };

    const loadEditTask = async () => {
        if (!isEdit.value) return;
        const detail = await opnameService.getDetail(editingId.value);
        formState.title = String(detail.title ?? formState.title);
        formState.docNumber = String(detail.profile_id ?? formState.docNumber);
        formState.notes = String(detail.description ?? "");
        formState.assignedToId = String(
            (detail.assignedTo as { id?: string } | undefined)?.id ??
                detail.assignedToId ??
                "",
        );
        formState.assignedAt = String(detail.assignedAt ?? "").slice(0, 10);
        formState.deadlineAt = String(detail.deadlineAt ?? "").slice(0, 10);
        const locations =
            (detail.locations as { id?: string }[] | undefined) ?? [];
        locationIds.value = locations
            .map((location) => String(location.id ?? ""))
            .filter(Boolean);
    };

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
        routeParentId,
        (nextParentId) => {
            if (nextParentId) selectedParentId.value = nextParentId;
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
            void loadLocations();
            void loadUsers();
        },
        { immediate: true },
    );

    watch(
        editingId,
        () => {
            void loadEditTask();
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
        if (!formState.title.trim()) {
            notifyError("Title wajib diisi.");
            return;
        }
        if (mode.value !== "task" && !formState.docNumber.trim()) {
            notifyError("Title dan Document Number wajib diisi.");
            return;
        }
        if (mode.value !== "group" && !parentId.value && !isEdit.value) {
            notifyError("Parent wajib dipilih untuk profile dan task.");
            return;
        }
        if (mode.value === "task") {
            if (!locationIds.value.length) {
                notifyError("Pilih minimal satu lokasi bertag.");
                return;
            }
            if (
                !formState.assignedToId ||
                !formState.assignedAt ||
                !formState.deadlineAt
            ) {
                notifyError(
                    "Assigned user, assigned date, dan deadline wajib diisi.",
                );
                return;
            }
            if (formState.deadlineAt < formState.assignedAt) {
                notifyError("Deadline harus pada atau setelah assigned date.");
                return;
            }
        }

        submitting.value = true;
        try {
            if (isEdit.value) {
                await opnameService.update(editingId.value, {
                    title: formState.title.trim(),
                    notes: formState.notes.trim() || undefined,
                    locationIds: locationIds.value,
                    assignedToId: formState.assignedToId,
                    assignedAt: formState.assignedAt,
                    deadlineAt: formState.deadlineAt,
                });
                notifySuccess("Opname task updated");
            } else {
                const payload: OpnameNodePayload = {
                    companyId: companyId.value,
                    warehouseId: selectedWarehouseId.value,
                    title: formState.title.trim(),
                    notes: formState.notes.trim() || undefined,
                    parentId: parentId.value || null,
                    nodeType: mode.value,
                };
                if (mode.value === "task") {
                    payload.locationIds = locationIds.value;
                    payload.assignedToId = formState.assignedToId;
                    payload.assignedAt = formState.assignedAt;
                    payload.deadlineAt = formState.deadlineAt;
                } else {
                    payload.docNumber = formState.docNumber.trim();
                }

                if (parentId.value) {
                    await opnameService.createChild(parentId.value, payload);
                } else {
                    await opnameService.create(payload);
                }
                notifySuccess("Opname node created");
            }
            router.push({
                path: "/transactions/opname",
                query: {
                    warehouseId: selectedWarehouseId.value || undefined,
                },
            });
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
        parentOptions,
        selectedWarehouseId,
        selectedParentId,
        selectedWarehouseLabel,
        selectedParent,
        handleBack,
        saveNode,
        loadContext,
        locationIds,
        locationOptions,
        userOptions,
        isEdit,
    };
}
