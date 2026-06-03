<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center px-2">
            <div>
                <h3 class="text-lg font-medium text-gray-900">Roles</h3>
                <p class="text-sm text-gray-500">
                    Manage application roles and access levels.
                </p>
            </div>
            <Button variant="primary" @click="openCreateModal">
                New Role
            </Button>
        </div>

        <Card no-padding>
            <div v-if="loading" class="p-6">
                <LoadingState :lines="3" />
            </div>
            <div v-else-if="error" class="p-6 text-sm text-rose-600 bg-rose-50">
                {{ error }}
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
                                onClick: () => openEditModal(row),
                            },
                        ]"
                    />
                </template>
            </AppTable>
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
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <Input
                    id="name"
                    v-model="form.name"
                    label="Role Name"
                    placeholder="e.g. SUPER_ADMIN"
                    required
                />
                <Input
                    id="description"
                    v-model="form.description"
                    label="Description"
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
import { ref, onMounted, computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import AppTable from "@/components/organisms/Table.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
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

onMounted(() => loadData());
</script>
