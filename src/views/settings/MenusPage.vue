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
                    />
                </div>
                <Button
                    variant="primary"
                    @click="openCreateModal"
                    :disabled="!selectedAppId"
                >
                    New Menu
                </Button>
            </div>
        </div>

        <Card no-padding>
            <div v-if="loadingApps" class="p-6">
                <LoadingState :lines="1" />
            </div>
            <div
                v-else-if="!selectedAppId"
                class="p-12 text-center text-gray-500"
            >
                Please select an application to view its menus.
            </div>
            <div v-else-if="loading" class="p-6">
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
            :title="isEditing ? 'Edit Menu' : 'New Menu'"
            :description="
                isEditing ? 'Update menu details.' : 'Create a new menu item.'
            "
            width="md"
            @update:model-value="(v) => (isModalOpen = v)"
        >
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <Input
                    id="code"
                    v-model="form.code"
                    label="Menu Code"
                    placeholder="e.g. INBOUND"
                    required
                />
                <Input
                    id="name"
                    v-model="form.name"
                    label="Menu Name"
                    placeholder="e.g. Inbound Transactions"
                    required
                />
                <Input
                    id="path"
                    v-model="form.path"
                    label="Path"
                    placeholder="e.g. /inbound"
                />
                <Input
                    id="icon"
                    v-model="form.icon"
                    label="Icon Name"
                    placeholder="e.g. Inbox"
                />
                <Input
                    id="sequence"
                    v-model="form.sequence"
                    label="Sequence (Order)"
                    type="number"
                />

                <div
                    class="flex justify-end gap-3 pt-4 border-t border-gray-100"
                >
                    <Button
                        type="button"
                        variant="outline"
                        @click="isModalOpen = false"
                        >Cancel</Button
                    >
                    <Button
                        type="submit"
                        variant="primary"
                        :disabled="submitting"
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
import Select from "@/components/atoms/Select.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import AppTable from "@/components/organisms/Table.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
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

onMounted(() => {
    loadApps();
});
</script>
