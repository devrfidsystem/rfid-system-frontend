import { ref, type ComputedRef, type Ref } from "vue";
import type { EntityKey } from "@/model/entities";
import type { MasterEntityConfig } from "@/domain/master/entityConfig";
import type { MasterRecord } from "@/domain/master/types";
import type { MasterEntityKey } from "@/api/feature/dto/master.dto";
import {
    buildMasterCreatePayload,
    buildMasterUpdatePayload,
} from "../masterPayload";
import type { MasterSubmittedData } from "./masterFormTypes";
import {
    createMasterRecord,
    deleteMasterRecord,
    getMasterImageFile,
    updateMasterRecord,
} from "./masterSubmitOperations";

type BuildProductAttributeValues = (
    submittedData: MasterSubmittedData,
) => unknown[] | undefined;

type ApplyLocationWarehouseContext = (
    payload: Record<string, unknown>,
    row?: MasterRecord,
) => Promise<void>;

type AttachCompanyContext = (
    payload: Record<string, unknown>,
    row?: MasterRecord,
) => void;

type WithToast = (
    operation: () => Promise<void>,
    options: { successMessage: string; errorMessage: string },
) => Promise<unknown>;

interface UseMasterSubmitOptions {
    entityKey: ComputedRef<EntityKey>;
    config: ComputedRef<MasterEntityConfig>;
    selectedRow: Ref<MasterRecord | null>;
    loadError: Ref<string | null>;
    isMasterApiEntity: (key: EntityKey) => key is MasterEntityKey;
    buildProductAttributeValues: BuildProductAttributeValues;
    applyLocationWarehouseContext: ApplyLocationWarehouseContext;
    attachCompanyContext: AttachCompanyContext;
    loadRows: () => Promise<void>;
    closeAdd: () => void;
    closeEdit: () => void;
    closeDelete: () => void;
    notifyError: (message: string) => void;
    withToast: WithToast;
}

const attachAttributeValues = (
    payload: Record<string, unknown>,
    attributeValues: unknown[] | undefined,
) => {
    if (attributeValues?.length) {
        payload.attributeValues = attributeValues;
    }
};

export function useMasterSubmit({
    entityKey,
    config,
    selectedRow,
    loadError,
    isMasterApiEntity,
    buildProductAttributeValues,
    applyLocationWarehouseContext,
    attachCompanyContext,
    loadRows,
    closeAdd,
    closeEdit,
    closeDelete,
    notifyError,
    withToast,
}: UseMasterSubmitOptions) {
    const isSubmitting = ref(false);
    const isDeleting = ref(false);

    const handleCreate = async (submittedData: MasterSubmittedData) => {
        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }

        const payload = buildMasterCreatePayload(key, submittedData);
        if (!Object.keys(payload).length) return;

        const imageFile = getMasterImageFile(submittedData);
        attachAttributeValues(
            payload,
            buildProductAttributeValues(submittedData),
        );
        delete payload.imageFile;

        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    await createMasterRecord({
                        entityKey: key,
                        masterKey: key,
                        payload,
                        imageFile,
                        applyLocationWarehouseContext,
                        attachCompanyContext,
                        notifyError,
                    });
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

    const handleUpdate = async (submittedData: MasterSubmittedData) => {
        const row = selectedRow.value;
        if (!row?.id) return;

        const key = entityKey.value;
        if (!isMasterApiEntity(key)) {
            loadError.value = "API endpoint not available for this entity.";
            return;
        }

        const payload = buildMasterUpdatePayload(key, submittedData);
        const imageFile = getMasterImageFile(submittedData);
        attachAttributeValues(
            payload,
            buildProductAttributeValues(submittedData),
        );
        delete payload.imageFile;

        isSubmitting.value = true;
        try {
            await withToast(
                async () => {
                    await updateMasterRecord({
                        entityKey: key,
                        masterKey: key,
                        row,
                        payload,
                        imageFile,
                        applyLocationWarehouseContext,
                        attachCompanyContext,
                        notifyError,
                    });
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
                    if (!isMasterApiEntity(key)) {
                        throw new Error(
                            "API endpoint not removable or not available.",
                        );
                    }
                    await deleteMasterRecord(key, String(row.id));
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

    return {
        isSubmitting,
        isDeleting,
        handleCreate,
        handleUpdate,
        handleDelete,
    };
}
