<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center px-2">
            <div>
                <h3 class="text-lg font-medium text-gray-900">Roles</h3>
                <p class="text-sm text-gray-500">
                    Manage application roles and access levels.
                </p>
            </div>
            <Button
                variant="primary"
                object-id="btn_RolesNewRole"
                @click="openCreateModal"
            >
                New Role
            </Button>
        </div>

        <Card no-padding object-id="wdg_RolesList">
            <DataTable
                object-id="RolesList"
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
                                onClick: () => openEditModal(row),
                            },
                        ]"
                    />
                </template>
            </DataTable>
        </Card>

        <Drawer
            :model-value="isModalOpen"
            :title="isEditing ? 'Edit Role' : 'New Role'"
            :description="
                isEditing ? 'Update role details.' : 'Create a new role.'
            "
            width="md"
            @update:model-value="(v) => (isModalOpen = v)"
        >
            <form class="space-y-6" @submit.prevent="handleSubmit">
                <Input
                    id="txt_RolesFormName"
                    v-model="form.name"
                    label="Role Name"
                    placeholder="e.g. SUPER_ADMIN"
                    required
                    object-id="txt_RolesFormName"
                />
                <Input
                    id="txt_RolesFormDescription"
                    v-model="form.description"
                    label="Description"
                    object-id="txt_RolesFormDescription"
                />

                <div
                    class="flex justify-end gap-3 pt-4 border-t border-gray-100"
                >
                    <Button
                        type="button"
                        variant="outline"
                        object-id="btn_RolesFormCancel"
                        @click="isModalOpen = false"
                        >Cancel</Button
                    >
                    <Button
                        type="submit"
                        variant="primary"
                        :disabled="submitting"
                        object-id="btn_RolesFormSave"
                    >
                        {{ submitting ? "Saving..." : "Save" }}
                    </Button>
                </div>
            </form>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted, computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import RowActions from "@/components/ui/table/RowActions.vue";
import { iamService } from "@/services/iam.service";

const columns = [
    { key: "name", label: "Role Name" },
    { key: "description", label: "Description" },
    { key: "actions", label: "" },
];

const rows = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const currentId = ref("");

const form = ref({
    name: "",
    description: "",
});

const tableRows = computed(() => {
    return rows.value.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || "-",
        original: r,
    }));
});

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await iamService.getRoles();
        rows.value = response || [];
    } catch (err: any) {
        error.value = err.message || "Failed to load roles";
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    form.value = { name: "", description: "" };
    isEditing.value = false;
    currentId.value = "";
    isModalOpen.value = true;
};

const openEditModal = (row: any) => {
    const original = row.original;
    form.value = {
        name: original.name,
        description: original.description || "",
    };
    isEditing.value = true;
    currentId.value = original.id;
    isModalOpen.value = true;
};

const handleSubmit = async () => {
    submitting.value = true;
    try {
        if (isEditing.value) {
            await iamService.updateRole(currentId.value, form.value);
        } else {
            await iamService.createRole(form.value);
        }
        isModalOpen.value = false;
        loadData();
    } catch (err: any) {
        alert(err.message || "Failed to save role");
    } finally {
        submitting.value = false;
    }
};

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    columns
        .filter((column) => column.key !== "actions")
        .map((column) => ({ key: column.key, header: column.label })),
);

onMounted(() => loadData());
</script>
