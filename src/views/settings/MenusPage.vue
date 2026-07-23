<template>
    <div class="space-y-4">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4"
        >
            <div>
                <h3 class="text-lg font-medium text-gray-900">Menus</h3>
                <p class="text-sm text-gray-500">
                    Manage application menus and navigation.
                </p>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto">
                <div class="w-64">
                    <Select
                        v-model="selectedAppId"
                        :options="appOptions"
                        placeholder="Select Application"
                        object-id="cmb_MenusSelectApp"
                    />
                </div>
                <Button
                    variant="primary"
                    :disabled="!selectedAppId"
                    object-id="btn_MenusNewMenu"
                    @click="openCreateModal"
                >
                    New Menu
                </Button>
            </div>
        </div>

        <Card no-padding object-id="wdg_MenusList">
            <div v-if="loadingApps" class="p-6">
                <LoadingState :lines="1" />
            </div>
            <div
                v-else-if="!selectedAppId"
                class="p-12 text-center text-gray-500"
            >
                Please select an application to view its menus.
            </div>
            <DataTable
                v-else
                object-id="MenusList"
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
            :title="isEditing ? 'Edit Menu' : 'New Menu'"
            :description="
                isEditing ? 'Update menu details.' : 'Create a new menu item.'
            "
            width="md"
            @update:model-value="(v) => (isModalOpen = v)"
        >
            <form class="space-y-6" @submit.prevent="handleSubmit">
                <Input
                    id="code"
                    v-model="form.code"
                    label="Menu Code"
                    placeholder="e.g. INBOUND"
                    required
                    object-id="txt_MenusFormCode"
                />
                <Input
                    id="name"
                    v-model="form.name"
                    label="Menu Name"
                    placeholder="e.g. Inbound Transactions"
                    required
                    object-id="txt_MenusFormName"
                />
                <Input
                    id="path"
                    v-model="form.path"
                    label="Path"
                    placeholder="e.g. /inbound"
                    object-id="txt_MenusFormPath"
                />
                <Input
                    id="icon"
                    v-model="form.icon"
                    label="Icon Name"
                    placeholder="e.g. Inbox"
                    object-id="txt_MenusFormIcon"
                />
                <Input
                    id="sequence"
                    v-model="form.sequence"
                    label="Sequence (Order)"
                    type="number"
                    object-id="nmf_MenusFormSequence"
                />

                <div
                    class="flex justify-end gap-3 pt-4 border-t border-gray-100"
                >
                    <Button
                        type="button"
                        variant="outline"
                        object-id="btn_MenusFormCancel"
                        @click="isModalOpen = false"
                        >Cancel</Button
                    >
                    <Button
                        type="submit"
                        variant="primary"
                        :disabled="submitting"
                        object-id="btn_MenusFormSave"
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
import Select from "@/components/atoms/Select.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import RowActions from "@/components/ui/table/RowActions.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import { useMenus } from "./composables/useMenus";

const {
    columns,
    appOptions,
    selectedAppId,
    loadingApps,
    loading,
    error,
    isModalOpen,
    isEditing,
    submitting,
    form,
    tableRows,
    loadApps,
    openCreateModal,
    openEditModal,
    handleSubmit,
} = useMenus();

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    columns
        .filter((column) => column.key !== "actions")
        .map((column) => ({ key: column.key, header: column.label })),
);

onMounted(() => {
    loadApps();
});
</script>
