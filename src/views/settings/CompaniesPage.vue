<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center px-2">
            <div>
                <h3 class="text-lg font-medium text-gray-900">Companies</h3>
                <p class="text-sm text-gray-500">
                    Manage registered companies.
                </p>
            </div>
            <Button variant="primary" @click="openCreateModal">
                New Company
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
            :title="isEditing ? 'Edit Company' : 'New Company'"
            :description="
                isEditing
                    ? 'Update company details.'
                    : 'Register a new company.'
            "
            width="md"
            @update:model-value="(v) => (isModalOpen = v)"
        >
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <Input
                    id="code"
                    v-model="form.code"
                    label="Company Code"
                    placeholder="e.g. COMP-001"
                    required
                />
                <Input
                    id="name"
                    v-model="form.name"
                    label="Company Name"
                    placeholder="e.g. PT Example"
                    required
                />
                <Input
                    id="description"
                    v-model="form.description"
                    label="Description"
                />
                <div class="flex items-center gap-2 mt-4">
                    <input
                        type="checkbox"
                        id="isActive"
                        v-model="form.isActive"
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
import { settingsService } from "@/services/settings.service";

const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
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
    code: "",
    name: "",
    description: "",
    isActive: true,
});

const tableRows = computed(() => {
    return rows.value.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        status: r.isActive ? "Active" : "Inactive",
        original: r,
    }));
});

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await settingsService.fetchList("companies");
        rows.value = response.items || [];
    } catch (err: any) {
        error.value = err.message || "Failed to load companies";
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    form.value = { code: "", name: "", description: "", isActive: true };
    isEditing.value = false;
    currentId.value = "";
    isModalOpen.value = true;
};

const openEditModal = (row: any) => {
    const original = row.original;
    form.value = {
        code: original.code,
        name: original.name,
        description: original.description || "",
        isActive: original.isActive ?? true,
    };
    isEditing.value = true;
    currentId.value = original.id;
    isModalOpen.value = true;
};

const handleSubmit = async () => {
    submitting.value = true;
    try {
        if (isEditing.value) {
            await settingsService.update(
                "companies",
                currentId.value,
                form.value,
            );
        } else {
            await settingsService.create("companies", form.value);
        }
        isModalOpen.value = false;
        loadData();
    } catch (err: any) {
        alert(err.message || "Failed to save company");
    } finally {
        submitting.value = false;
    }
};

onMounted(() => loadData());
</script>
