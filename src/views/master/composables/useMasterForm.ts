import { ref, reactive, watch } from "vue";
import { useNotifier } from "@/composable/useNotifier";
import { masterService } from "@/services/master.service";
import type { MasterRecord } from "../types";
import type { MasterEntityKey } from "@/api/feature/dto/master.dto";
import type { useMasterContext } from "./useMasterContext";
import type { useMasterTable } from "./useMasterTable";

export function useMasterForm(
    context: ReturnType<typeof useMasterContext>,
    table: ReturnType<typeof useMasterTable>,
) {
    const {
        entityKey,
        config,
        isMasterApiEntity,
        authStore,
        companyAwareEntities,
        ensureLocationWarehouseContext,
        locationWarehouseId,
        route,
    } = context;
    const { loadRows, loadError } = table;
    const { withToast, notifyError } = useNotifier();

    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showDeleteModal = ref(false);
    const selectedRow = ref<MasterRecord | null>(null);
    const formState = reactive<Record<string, string>>({});
    const uomSelectOptions = ref<{ label: string; value: string }[]>([]);
    const categorySelectOptions = ref<{ label: string; value: string }[]>([]);
    const supplierSelectOptions = ref<{ label: string; value: string }[]>([]);
    const customerSelectOptions = ref<{ label: string; value: string }[]>([]);
    const isSubmitting = ref(false);
    const isDeleting = ref(false);

    const resetForm = () => {
        config.value.formFields.forEach((field) => {
            formState[field.key] = "";
        });
    };

    const loadProductReferenceData = async () => {
        if (entityKey.value !== "products") {
            uomSelectOptions.value = [];
            categorySelectOptions.value = [];
            supplierSelectOptions.value = [];
            customerSelectOptions.value = [];
            return;
        }
        try {
            const params = authStore.currentCompanyId
                ? { companyId: authStore.currentCompanyId }
                : undefined;
            const [
                uomRecords,
                categoryRecords,
                supplierRecords,
                customerRecords,
            ] = await Promise.all([
                masterService.fetchOptions("uoms", params),
                masterService.fetchOptions("product-categories", params),
                masterService.fetchOptions("suppliers", params),
                masterService.fetchOptions("customers", params),
            ]);
            uomSelectOptions.value = uomRecords.map((uom) => ({
                value: String(uom.id),
                label:
                    [uom.symbol, uom.name].filter(Boolean).join(" · ") ||
                    uom.symbol ||
                    uom.name,
            }));
            categorySelectOptions.value = categoryRecords.map((category) => ({
                value: String(category.id),
                label: category.name,
            }));
            supplierSelectOptions.value = supplierRecords.map((supplier) => ({
                value: String(supplier.id),
                label: supplier.name,
            }));
            customerSelectOptions.value = customerRecords.map((customer) => ({
                value: String(customer.id),
                label: customer.name,
            }));
        } catch {
            notifyError("Gagal memuat referensi produk.");
        }
    };

    const applyLocationWarehouseContext = async (
        payload: MasterRecord,
        row?: MasterRecord,
    ): Promise<void> => {
        if (entityKey.value !== "locations") return;
        const rowWarehouseId = row?.warehouseId;
        const contextWarehouseId = rowWarehouseId ?? locationWarehouseId.value;
        const warehouseId =
            contextWarehouseId ?? (await ensureLocationWarehouseContext());
        if (!warehouseId)
            throw new Error("Lokasi membutuhkan gudang yang valid.");
        payload.warehouseId = warehouseId;
    };

    const attachCompanyContext = (
        payload: MasterRecord,
        row?: MasterRecord,
    ) => {
        const requiresCompany = companyAwareEntities.includes(
            entityKey.value as MasterEntityKey,
        );
        if (!requiresCompany) return;
        const companyId = row?.companyId ?? authStore.currentCompanyId;
        if (!companyId)
            throw new Error(
                "Tidak ada perusahaan aktif untuk menyimpan data master ini.",
            );
        payload.companyId = companyId;
    };

    const submitPayload = (submittedData: Record<string, string>) => {
        const payload: MasterRecord = {};
        config.value.formFields.forEach((field) => {
            const value = submittedData[field.key]?.trim();
            if (!value) return;
            payload[field.key] = ["rowNo", "colNo"].includes(field.key)
                ? Number(value)
                : value;
        });
        return payload;
    };

    const openAdd = () => {
        resetForm();
        if (!isMasterApiEntity(entityKey.value)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        showAddModal.value = true;
    };

    const closeAdd = () => {
        showAddModal.value = false;
    };

    const openEdit = (row: MasterRecord) => {
        selectedRow.value = row;
        config.value.formFields.forEach((field) => {
            formState[field.key] =
                row[field.key] != null ? String(row[field.key]) : "";
        });
        showEditModal.value = true;
    };

    const closeEdit = () => {
        selectedRow.value = null;
        showEditModal.value = false;
    };

    const confirmDelete = (row: MasterRecord) => {
        selectedRow.value = row;
        showDeleteModal.value = true;
    };

    const closeDelete = () => {
        selectedRow.value = null;
        showDeleteModal.value = false;
    };

    const handleCreate = async (submittedData: Record<string, string>) => {
        const payload = submitPayload(submittedData);
        if (!Object.keys(payload).length) return;
        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }
        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    await applyLocationWarehouseContext(payload);
                    attachCompanyContext(payload);
                    await masterService.create(key, payload as never);
                },
                {
                    successMessage: `Created ${config.value.title}`,
                    errorMessage: `Failed to create ${config.value.title}`,
                },
            );
            closeAdd();
            await loadRows();
        } finally {
            isSubmitting.value = false;
        }
    };

    const handleUpdate = async (submittedData: Record<string, string>) => {
        const row = selectedRow.value;
        if (!row?.id) return;
        const payload = submitPayload(submittedData);
        const key = entityKey.value;
        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    if (!isMasterApiEntity(key)) {
                        throw new Error(
                            "API endpoint not available for this entity.",
                        );
                    }
                    await applyLocationWarehouseContext(payload, row);
                    attachCompanyContext(payload, row);
                    await masterService.update(
                        key,
                        String(row.id),
                        payload as never,
                    );
                },
                {
                    successMessage: `Updated ${config.value.title}`,
                    errorMessage: `Failed to update ${config.value.title}`,
                },
            );
            closeEdit();
            await loadRows();
        } finally {
            isSubmitting.value = false;
        }
    };

    const handleDelete = async () => {
        const row = selectedRow.value;
        if (!row?.id) return;
        const key = entityKey.value;
        isDeleting.value = true;
        try {
            await withToast(
                async () => {
                    if (
                        !isMasterApiEntity(key) ||
                        !masterService.isRemovable(key)
                    ) {
                        throw new Error(
                            "API endpoint not removable or not available.",
                        );
                    }
                    await masterService.remove(key, String(row.id));
                },
                {
                    successMessage: `Deleted ${config.value.title}`,
                    errorMessage: `Failed to delete ${config.value.title}`,
                },
            );
            closeDelete();
            await loadRows();
        } finally {
            isDeleting.value = false;
        }
    };

    const resetFormState = () => {
        resetForm();
        selectedRow.value = null;
        closeAdd();
        closeEdit();
        closeDelete();
    };

    watch(
        entityKey,
        () => {
            resetFormState();
            void loadProductReferenceData();
        },
        { immediate: true },
    );

    watch(
        () => authStore.currentCompanyId,
        () => {
            if (entityKey.value === "products") void loadProductReferenceData();
        },
    );

    watch(
        () => route.fullPath,
        () => {
            closeAdd();
            closeEdit();
            closeDelete();
        },
    );

    return {
        showAddModal,
        showEditModal,
        showDeleteModal,
        formState,
        uomSelectOptions,
        categorySelectOptions,
        supplierSelectOptions,
        customerSelectOptions,
        isSubmitting,
        isDeleting,
        openAdd,
        closeAdd,
        openEdit,
        closeEdit,
        confirmDelete,
        closeDelete,
        handleCreate,
        handleUpdate,
        handleDelete,
    };
}
