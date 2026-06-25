import { computed } from "vue";
import { useMasterContext } from "./useMasterContext";
import { useMasterTable } from "./useMasterTable";
import { useMasterForm } from "./useMasterForm";
import type { MasterRecord } from "../types";
import { masterService } from "@/services/master.service";

/**
 * Facade composable that orchestrates Context, Table, and Form composables.
 * Exposes a unified API for MasterEntityPage.vue.
 */
export function useMasterEntity() {
    const context = useMasterContext();
    const table = useMasterTable(context);
    const form = useMasterForm(context, table);

    const {
        config,
        entityKey,
        isMasterApiEntitySelected,
        isMasterApiEntity,
        unsupportedFeatureMessage,
    } = context;

    const {
        keyword,
        rows,
        sortOrder,
        toggleSort,
        loading,
        loadError,
        unsupportedFeature,
        pagination,
        refresh,
    } = table;

    const {
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
    } = form;

    const columnDefs = computed(() =>
        config.value.columns.map((column) => ({
            ...column,
            accessor:
                column.accessor ?? ((row: MasterRecord) => row[column.key]),
        })),
    );

    const showDeleteButton = computed(
        () =>
            isMasterApiEntity(entityKey.value) &&
            masterService.isRemovable(entityKey.value),
    );

    return {
        config,
        keyword,
        rows,
        sortOrder,
        toggleSort,
        loading,
        loadError,
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
        unsupportedFeature,
        unsupportedFeatureMessage,
        pagination,
        columnDefs,
        isMasterApiEntitySelected,
        showDeleteButton,
        openAdd,
        closeAdd,
        openEdit,
        closeEdit,
        confirmDelete,
        closeDelete,
        handleCreate,
        handleUpdate,
        handleDelete,
        refresh,
    };
}
