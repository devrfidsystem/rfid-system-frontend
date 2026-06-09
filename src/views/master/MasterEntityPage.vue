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
                :title="config.title"
                :can-add="isMasterApiEntitySelected"
                :sort-order="sortOrder"
                @add="openAdd"
                @refresh="refresh"
                @sort="toggleSort"
            />
            <MasterTable
                v-model:page="pagination.page"
                v-model:limit="pagination.limit"
                :rows="rows"
                :column-defs="columnDefs"
                :loading="loading"
                :load-error="loadError"
                :unsupported-feature="unsupportedFeature"
                :unsupported-feature-message="unsupportedFeatureMessage"
                :show-delete-button="showDeleteButton"
                :total="pagination.total"
                :show-pagination="isMasterApiEntitySelected"
                @edit="openEdit"
                @delete="confirmDelete"
            />
        </Card>

        <MasterFormModal
            :is-open="showAddModal"
            :title="`Add ${config.title}`"
            :form-fields="config.formFields"
            :initial-state="formState"
            :is-submitting="isSubmitting"
            :is-edit="false"
            :uom-options="uomSelectOptions"
            :category-options="categorySelectOptions"
            @close="closeAdd"
            @submit="handleCreate"
        />

        <MasterFormModal
            :is-open="showEditModal"
            :title="`Edit ${config.title}`"
            :form-fields="config.formFields"
            :initial-state="formState"
            :is-submitting="isSubmitting"
            :is-edit="true"
            :uom-options="uomSelectOptions"
            :category-options="categorySelectOptions"
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
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import MasterHeader from "./components/MasterHeader.vue";
import MasterTable from "./components/MasterTable.vue";
import MasterFormModal from "./components/MasterFormModal.vue";
import MasterDeleteModal from "./components/MasterDeleteModal.vue";
import { useMasterEntity } from "./composables/useMasterEntity";

const {
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
} = useMasterEntity();
</script>
