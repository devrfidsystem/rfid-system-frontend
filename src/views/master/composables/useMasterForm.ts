import { computed, reactive, watch } from "vue";
import { useNotifier } from "@/composable/useNotifier";
import type { MasterRecord } from "@/domain/master/types";
import type { MasterEntityKey } from "@/api/feature/dto/master.dto";
import type { useMasterContext } from "./useMasterContext";
import type { useMasterTable } from "./useMasterTable";
import type { MasterFormField } from "@/domain/master/entityConfig";
import type { MasterFormValue, MasterSubmittedData } from "./masterFormTypes";
import { buildProductAttributeValues as buildProductAttributePayloadValues } from "./masterProductAttributes";
import { useMasterLocationReferences } from "./useMasterLocationReferences";
import { useMasterProductReferences } from "./useMasterProductReferences";
import { useMasterFormLifecycle } from "./useMasterFormLifecycle";
import { useMasterImport } from "./useMasterImport";
import { useMasterSubmit } from "./useMasterSubmit";

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
    const { withToast, notifyError, notifySuccess } = useNotifier();

    const formState = reactive<Record<string, MasterFormValue>>({});
    const {
        uomSelectOptions,
        categorySelectOptions,
        supplierSelectOptions,
        customerSelectOptions,
        productAttributeDefinitions,
        productAttributeFields,
        loadProductReferenceData,
    } = useMasterProductReferences({
        entityKey,
        authStore,
        notifyError,
    });
    const {
        warehouseSelectOptions,
        locationSelectOptions,
        loadLocationReferenceData,
        loadLocationOptions,
        applyLocationWarehouseContext,
        prepareLocationAdd,
        syncLocationRow,
    } = useMasterLocationReferences({
        entityKey,
        formState,
        authStore,
        locationWarehouseId,
        ensureLocationWarehouseContext,
        notifyError,
    });

    const formFields = computed<MasterFormField[]>(() => {
        const fields = [...config.value.formFields];
        if (entityKey.value === "products") {
            const imageIndex = fields.findIndex(
                (field) => field.key === "imageFile",
            );
            const insertAt = imageIndex >= 0 ? imageIndex : fields.length;
            fields.splice(insertAt, 0, ...productAttributeFields.value);
        }
        return fields;
    });
    const {
        showAddModal,
        showEditModal,
        showDeleteModal,
        selectedRow,
        resetFormState,
        openAdd,
        closeAdd,
        openEdit,
        closeEdit,
        confirmDelete,
        closeDelete,
        syncFormFromRow,
    } = useMasterFormLifecycle({
        entityKey,
        formFields,
        formState,
        loadError,
        isMasterApiEntity,
        prepareLocationAdd,
        syncLocationRow,
    });

    const attachCompanyContext = (
        payload: Record<string, unknown>,
        row?: MasterRecord,
    ) => {
        const requiresCompany = companyAwareEntities.includes(
            entityKey.value as MasterEntityKey,
        );
        if (!requiresCompany) return;
        const companyId = row?.companyId ?? authStore.currentCompanyId;
        if (!companyId) {
            throw new Error(
                "Tidak ada perusahaan aktif untuk menyimpan data master ini.",
            );
        }
        payload.companyId = companyId;
    };

    const buildProductAttributeValues = (
        submittedData: MasterSubmittedData,
    ) => {
        if (entityKey.value !== "products") return undefined;
        return buildProductAttributePayloadValues(
            productAttributeDefinitions.value,
            submittedData,
        );
    };
    const { isImporting, handleImport } = useMasterImport({
        entityKey,
        config,
        formFields,
        loadError,
        isMasterApiEntity,
        buildProductAttributeValues,
        applyLocationWarehouseContext,
        attachCompanyContext,
        loadRows,
        notifyError,
        notifySuccess,
    });
    const {
        isSubmitting,
        isDeleting,
        handleCreate,
        handleUpdate,
        handleDelete,
    } = useMasterSubmit({
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
    });

    watch(
        entityKey,
        () => {
            resetFormState();
            void loadProductReferenceData();
            void loadLocationReferenceData();
        },
        { immediate: true },
    );

    watch(
        () => authStore.currentCompanyId,
        () => {
            if (entityKey.value === "products") void loadProductReferenceData();
            if (entityKey.value === "locations")
                void loadLocationReferenceData();
        },
    );

    watch(
        () => formState.warehouseId,
        (warehouseId, oldWarehouseId) => {
            if (entityKey.value !== "locations") return;
            const nextWarehouseId = String(warehouseId ?? "");
            if (!nextWarehouseId) {
                locationSelectOptions.value = [];
                return;
            }
            void loadLocationOptions(nextWarehouseId, selectedRow.value?.id);
            if (oldWarehouseId && oldWarehouseId !== warehouseId) {
                formState.parentId = "";
            }
        },
    );

    watch(
        () => productAttributeDefinitions.value,
        () => {
            if (entityKey.value !== "products" || !selectedRow.value) return;
            void syncFormFromRow(selectedRow.value);
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
        formFields,
        uomSelectOptions,
        categorySelectOptions,
        supplierSelectOptions,
        customerSelectOptions,
        warehouseSelectOptions,
        locationSelectOptions,
        isSubmitting,
        isDeleting,
        isImporting,
        openAdd,
        closeAdd,
        openEdit,
        closeEdit,
        confirmDelete,
        closeDelete,
        handleCreate,
        handleUpdate,
        handleDelete,
        handleImport,
    };
}
