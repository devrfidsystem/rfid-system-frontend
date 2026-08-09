import { ref, type ComputedRef, type Ref } from "vue";
import type { EntityKey } from "@/model/entities";
import type { MasterFormField } from "@/domain/master/entityConfig";
import type { MasterRecord } from "@/domain/master/types";
import type { MasterFormValue } from "./masterFormTypes";
import { syncProductAttributeValues } from "./masterProductAttributes";

interface UseMasterFormLifecycleOptions {
    entityKey: ComputedRef<EntityKey>;
    formFields: ComputedRef<MasterFormField[]>;
    formState: Record<string, MasterFormValue>;
    loadError: Ref<string | null>;
    isMasterApiEntity: (key: EntityKey) => boolean;
    prepareLocationAdd: () => Promise<void>;
    syncLocationRow: (row: MasterRecord) => Promise<void>;
}

export function useMasterFormLifecycle({
    entityKey,
    formFields,
    formState,
    loadError,
    isMasterApiEntity,
    prepareLocationAdd,
    syncLocationRow,
}: UseMasterFormLifecycleOptions) {
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showDeleteModal = ref(false);
    const selectedRow = ref<MasterRecord | null>(null);

    const resetForm = () => {
        formFields.value.forEach((field) => {
            if (field.type === "file") {
                formState[field.key] = null;
                return;
            }
            formState[field.key] = field.key === "isActive" ? "true" : "";
        });
    };

    const syncFormFromRow = async (row: MasterRecord) => {
        formFields.value.forEach((field) => {
            const value = row[field.key];
            formState[field.key] =
                value !== undefined && value !== null ? String(value) : "";
        });

        if (entityKey.value === "locations") {
            await syncLocationRow(row);
        }

        if (entityKey.value === "products") {
            syncProductAttributeValues(row, formState);
        }
    };

    const openAdd = async () => {
        resetForm();
        if (!isMasterApiEntity(entityKey.value)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }

        await prepareLocationAdd();

        showAddModal.value = true;
    };

    const closeAdd = () => {
        showAddModal.value = false;
    };

    const openEdit = async (row: MasterRecord) => {
        selectedRow.value = row;
        await syncFormFromRow(row);
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

    const resetFormState = () => {
        resetForm();
        selectedRow.value = null;
        closeAdd();
        closeEdit();
        closeDelete();
    };

    return {
        showAddModal,
        showEditModal,
        showDeleteModal,
        selectedRow,
        formState,
        resetFormState,
        openAdd,
        closeAdd,
        openEdit,
        closeEdit,
        confirmDelete,
        closeDelete,
        syncFormFromRow,
    };
}
