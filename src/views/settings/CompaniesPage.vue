<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center px-2">
            <div>
                <h3 class="text-lg font-medium text-gray-900">Companies</h3>
                <p class="text-sm text-gray-500">
                    Manage registered companies.
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
            <div v-if="loading" class="p-6">
                <LoadingState :lines="3" />
            </div>
            <div v-else-if="error" class="p-6 text-sm text-rose-600 bg-rose-50">
                {{ error }}
            </div>
            <div v-else-if="tableRows.length === 0" class="p-6">
                <EmptyState />
            </div>
            <AppTable
                v-else
                :columns="columns"
                :rows="tableRows"
                class="border-none shadow-none rounded-none"
                object-id="tbl_CompaniesList"
            >
                <template #actions="{ row }">
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
            </AppTable>
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
                        class="rounded border-gray-300 text-brand-600 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50"
                    />
                    <label for="isActive" class="text-sm text-gray-700"
                        >Active</label
                    >
                </div>

                <div
                    class="flex justify-end gap-3 pt-4 border-t border-gray-100"
                >
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
import { onMounted } from "vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import AppTable from "@/components/organisms/Table.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
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

onMounted(() => loadData());
</script>
