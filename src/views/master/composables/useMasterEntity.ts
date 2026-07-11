import { computed, ref } from "vue";
import { useMasterContext } from "./useMasterContext";
import { useMasterTable } from "./useMasterTable";
import { useMasterForm } from "./useMasterForm";
import type { MasterRecord } from "../types";
import { masterService } from "@/services/master.service";
import {
    buildLocationTreeSubtitle,
    buildLocationTreeRows,
    resolveLocationParentLabel,
    resolveLocationWarehouseLabel,
    resolveLocationTreeLabel,
} from "../locationTree";

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
        formFields,
        uomSelectOptions,
        categorySelectOptions,
        supplierSelectOptions,
        customerSelectOptions,
        warehouseSelectOptions,
        locationSelectOptions,
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

    const showDeleteButton = computed(
        () =>
            isMasterApiEntity(entityKey.value) &&
            masterService.isRemovable(entityKey.value),
    );

    const rowsById = computed(
        () =>
            new Map(
                rows.value
                    .filter((row) => row.id)
                    .map((row) => [String(row.id), row]),
            ),
    );

    const warehouseLabelsById = computed(
        () =>
            new Map(
                warehouseSelectOptions.value.map((option) => [
                    String(option.value),
                    option.label,
                ]),
            ),
    );

    const expandedLocationIds = ref<Set<string>>(new Set());

    const getLocationWarehouseLabel = (row: MasterRecord) =>
        resolveLocationWarehouseLabel(row, warehouseLabelsById.value);

    const getLocationParentLabel = (row: MasterRecord) =>
        resolveLocationParentLabel(row, rowsById.value);

    const getLocationPathLabel = (row: MasterRecord) =>
        resolveLocationTreeLabel(row);

    const toggleLocationTreeRow = (row: MasterRecord) => {
        const id = String(row.id ?? "");
        if (!id) return;
        const next = new Set(expandedLocationIds.value);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        expandedLocationIds.value = next;
    };

    const locationColumnAccessors: Record<
        string,
        (row: MasterRecord) => string | number | boolean | null | undefined
    > = {
        warehouseId: getLocationWarehouseLabel,
        parentId: getLocationParentLabel,
        path: getLocationPathLabel,
    };

    const displayRows = computed(() =>
        entityKey.value === "locations"
            ? buildLocationTreeRows(rows.value, expandedLocationIds.value).map(
                  (row) => ({
                      ...row,
                      treeSubtitle: buildLocationTreeSubtitle(
                          row,
                          rowsById.value,
                          warehouseLabelsById.value,
                      ),
                  }),
              )
            : rows.value,
    );

    return {
        config,
        keyword,
        rows: displayRows,
        sortOrder,
        toggleSort,
        loading,
        loadError,
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
        unsupportedFeature,
        unsupportedFeatureMessage,
        pagination,
        columnDefs: computed(() =>
            config.value.columns.map((column) => ({
                ...column,
                accessor:
                    entityKey.value === "locations" &&
                    locationColumnAccessors[column.key]
                        ? locationColumnAccessors[column.key]
                        : column.accessor ??
                          ((row: MasterRecord) =>
                              row[column.key] as
                                  | string
                                  | number
                                  | boolean
                                  | null
                                  | undefined),
            })),
        ),
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
        toggleLocationTreeRow,
    };
}
