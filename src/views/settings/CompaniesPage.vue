<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center px-2">
            <div>
                <h3 class="text-lg font-medium text-text">Companies</h3>
                <p class="text-sm text-text-secondary">
                    Maintain company records used for user and warehouse access.
                </p>
            </div>
            <Button
                variant="primary"
                object-id="btn_CompaniesNewCompany"
                @click="openCreateModal"
            >
                New Company
            </Button>
        </div>

        <Card no-padding object-id="wdg_CompaniesList">
            <DataTable
                object-id="CompaniesList"
                bare
                :rows="tableRows"
                :columns="dataTableColumns"
                :row-key="(row) => String(row.id ?? '')"
                :loading="loading"
                :load-error="error ?? undefined"
                :show-search="false"
            >
                <template #rowActions="{ row }">
                    <RowActions
                        :actions="[
                            {
                                key: 'edit',
                                label: 'Edit',
                                onClick: () => openEditModal(row as any),
                            },
                        ]"
                    />
                </template>
            </DataTable>
        </Card>

        <Drawer
            :model-value="isModalOpen"
            :title="isEditing ? 'Edit Company' : 'New Company'"
            :description="
                isEditing
                    ? 'Update company details.'
                    : 'Register a new company.'
            "
            width="md"
            @update:model-value="(v) => (isModalOpen = v)"
        >
            <form class="space-y-6" @submit.prevent="handleSubmit">
                <Input
                    id="txt_CompaniesFormCode"
                    v-model="form.code"
                    label="Company Code"
                    placeholder="e.g. COMP-001"
                    required
                    object-id="txt_CompaniesFormCode"
                />
                <Input
                    id="txt_CompaniesFormName"
                    v-model="form.name"
                    label="Company Name"
                    placeholder="e.g. PT Example"
                    required
                    object-id="txt_CompaniesFormName"
                />
                <Input
                    id="txt_CompaniesFormDescription"
                    v-model="form.description"
                    label="Description"
                    object-id="txt_CompaniesFormDescription"
                />
                <div class="flex items-center gap-2 mt-4">
                    <input
                        id="chk_CompaniesFormIsActive"
                        v-model="form.isActive"
                        data-testid="chk_CompaniesFormIsActive"
                        type="checkbox"
                        class="rounded border-border text-brand-600 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50"
                    />
                    <label
                        for="chk_CompaniesFormIsActive"
                        class="text-sm text-text"
                        >Active</label
                    >
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="outline"
                        object-id="btn_CompaniesFormCancel"
                        @click="isModalOpen = false"
                        >Cancel</Button
                    >
                    <Button
                        type="submit"
                        variant="primary"
                        :disabled="submitting"
                        object-id="btn_CompaniesFormSave"
                    >
                        {{ submitting ? "Saving..." : "Save" }}
                    </Button>
                </div>
            </form>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import RowActions from "@/components/ui/table/RowActions.vue";
import { useCompanies } from "./composables/useCompanies";

const {
    columns,
    loading,
    error,
    isModalOpen,
    isEditing,
    submitting,
    form,
    tableRows,
    loadData,
    openCreateModal,
    openEditModal,
    handleSubmit,
} = useCompanies();

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    columns
        .filter((column) => column.key !== "actions")
        .map((column) => ({ key: column.key, header: column.label })),
);

onMounted(() => loadData());
</script>
