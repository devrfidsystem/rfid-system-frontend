<template>
    <div class="space-y-4">
        <SectionHeader
            title="Companies"
            description="Maintain company records used for user and warehouse access."
            object-id="hdr_SettingsCompanies"
        >
            <Button
                variant="primary"
                class="w-full justify-center sm:w-auto"
                object-id="btn_CompaniesNewCompany"
                @click="openCreateModal"
            >
                Add Company
            </Button>
        </SectionHeader>

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
                                onClick: () =>
                                    openEditModal(row as CompanyTableRow),
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
                    ? 'Adjust company identity used by access policies.'
                    : 'Create a company record for warehouse access mapping.'
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
                <CheckboxField
                    v-model="form.isActive"
                    label="Active"
                    object-id="chk_CompaniesFormIsActive"
                    class="mt-4"
                />

                <FormActions sticky>
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
                </FormActions>
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
import CheckboxField from "@/components/ui/form/CheckboxField.vue";
import FormActions from "@/components/ui/form/FormActions.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import SectionHeader from "@/components/molecules/SectionHeader.vue";
import { useCompanies, type CompanyTableRow } from "./composables/useCompanies";

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
