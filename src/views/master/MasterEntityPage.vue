<template>
    <section class="space-y-6">
        <PageHeader
            :title="config.title"
            :description="config.description"
            tagline="Master Data"
        />
        <Card no-padding object-id="wdg_MasterEntityList">
            <MasterHeader
                v-model:keyword="keyword"
                v-model:filter-category-id="filters.categoryId"
                v-model:filter-uom-id="filters.uomId"
                v-model:filter-type="filters.type"
                v-model:filter-warehouse-id="filters.warehouseId"
                :title="config.title"
                :can-add="isMasterApiEntitySelected"
                :entity-key="config.entity"
                :category-options="categorySelectOptions"
                :uom-options="uomSelectOptions"
                :type-options="attributeTypeOptions"
                :warehouse-options="warehouseSelectOptions"
                :is-importing="isImporting"
                @add="openAdd"
                @refresh="refresh"
                @import="handleImport"
                @export="handleExport"
                @export-template="handleExportTemplate"
            />
            <DataTable
                object-id="MasterTable"
                bare
                :rows="rows"
                :columns="dataTableColumns"
                :row-key="rowKey"
                :loading="loading"
                :load-error="loadError ?? undefined"
                :unsupported-feature="unsupportedFeature"
                :unsupported-feature-message="unsupportedFeatureMessage"
                :show-search="false"
                :page-size-options="[10, 20, 50]"
                :page="pagination.page"
                :page-size="pagination.limit"
                :total="
                    isMasterApiEntitySelected ? pagination.total : undefined
                "
                tree-column-key="path"
                @update:page="pagination.page = $event"
                @update:page-size="pagination.limit = $event"
                @toggle-tree-row="toggleLocationTreeRow"
            >
                <template #isActive="{ row }">
                    <Badge :tone="row.isActive ? 'success' : 'error'">
                        {{ row.isActive ? "Active" : "Inactive" }}
                    </Badge>
                </template>
                <template #status="{ row }">
                    <Badge
                        v-if="row.status"
                        :tone="getStatusTone(row.status)"
                        class="capitalize"
                    >
                        {{ row.status }}
                    </Badge>
                    <span v-else class="text-text-muted">—</span>
                </template>
                <template #rowActions="{ row }">
                    <div class="flex flex-wrap justify-end gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            class="shrink-0"
                            object-id="btn_MasterTableEdit"
                            @click="openEdit(row)"
                        >
                            <Icon :icon="Pencil" :size="12" />
                            Edit
                        </Button>
                        <Button
                            v-if="showDeleteButton"
                            size="sm"
                            variant="danger"
                            class="shrink-0"
                            object-id="btn_MasterTableDelete"
                            @click="confirmDelete(row)"
                        >
                            <Icon :icon="Trash2" :size="12" />
                            Delete
                        </Button>
                    </div>
                </template>
            </DataTable>
        </Card>

        <MasterFormModal
            :is-open="showAddModal"
            :title="`Add ${config.title}`"
            :form-fields="formFields"
            :initial-state="formState"
            :is-submitting="isSubmitting"
            :is-edit="false"
            :uom-options="uomSelectOptions"
            :category-options="categorySelectOptions"
            :supplier-options="supplierSelectOptions"
            :customer-options="customerSelectOptions"
            :warehouse-options="warehouseSelectOptions"
            :location-options="locationSelectOptions"
            @close="closeAdd"
            @submit="handleCreate"
        />

        <MasterFormModal
            :is-open="showEditModal"
            :title="`Edit ${config.title}`"
            :form-fields="formFields"
            :initial-state="formState"
            :is-submitting="isSubmitting"
            :is-edit="true"
            :uom-options="uomSelectOptions"
            :category-options="categorySelectOptions"
            :supplier-options="supplierSelectOptions"
            :customer-options="customerSelectOptions"
            :warehouse-options="warehouseSelectOptions"
            :location-options="locationSelectOptions"
            @close="closeEdit"
            @submit="handleUpdate"
        />

        <MasterDeleteModal
            :is-open="showDeleteModal"
            :is-deleting="isDeleting"
            @close="closeDelete"
            @confirm="handleDelete"
        />
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Badge from "@/components/atoms/Badge.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import { Pencil, Trash2 } from "lucide-vue-next";
import MasterHeader from "./components/MasterHeader.vue";
import MasterFormModal from "./components/MasterFormModal.vue";
import MasterDeleteModal from "./components/MasterDeleteModal.vue";
import { useMasterEntity } from "./composables/useMasterEntity";
import { formatDate } from "@/utils/date";
import type { MasterRecord } from "./types";

const {
    config,
    keyword,
    rows,
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
    isImporting,
    unsupportedFeature,
    unsupportedFeatureMessage,
    pagination,
    filters,
    attributeTypeOptions,
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
    handleImport,
    handleExport,
    handleExportTemplate,
    refresh,
    toggleLocationTreeRow,
} = useMasterEntity();

const rowKey = (row: Record<string, unknown>) =>
    String(row.id ?? row.code ?? "");

const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
        return formatDate(value);
    }
    return String(value);
};

const getStatusTone = (status: unknown) => {
    const s = String(status).toLowerCase();
    if (
        s === "active" ||
        s === "published" ||
        s === "approved" ||
        s === "completed"
    )
        return "success";
    if (s === "draft" || s === "pending" || s === "processing")
        return "warning";
    if (
        s === "inactive" ||
        s === "archived" ||
        s === "rejected" ||
        s === "failed"
    )
        return "error";
    return "neutral";
};

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    columnDefs.value.map((column) => ({
        key: column.key,
        header: column.label,
        cell: (row: Record<string, unknown>) =>
            formatCellValue(column.accessor(row as MasterRecord)),
    })),
);
</script>
