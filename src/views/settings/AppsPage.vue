<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center px-2">
            <div>
                <h3 class="text-lg font-medium text-text">Applications</h3>
                <p class="text-sm text-text-secondary">
                    Control app entries used for menu routing and access scope.
                </p>
            </div>
            <Button
                variant="primary"
                object-id="btn_AppsNewApp"
                @click="openCreateModal"
            >
                New Application
            </Button>
        </div>

        <Card no-padding object-id="wdg_AppsList">
            <DataTable
                object-id="AppsList"
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
            :title="isEditing ? 'Edit Application' : 'New Application'"
            :description="
                isEditing
                    ? 'Update app details.'
                    : 'Register a new application.'
            "
            width="md"
            @update:model-value="(v) => (isModalOpen = v)"
        >
            <form class="space-y-6" @submit.prevent="handleSubmit">
                <Input
                    id="txt_AppsFormCode"
                    v-model="form.code"
                    label="App Code"
                    placeholder="e.g. WMS"
                    required
                    object-id="txt_AppsFormCode"
                />
                <Input
                    id="txt_AppsFormName"
                    v-model="form.name"
                    label="App Name"
                    placeholder="e.g. Warehouse System"
                    required
                    object-id="txt_AppsFormName"
                />
                <Input
                    id="txt_AppsFormDescription"
                    v-model="form.description"
                    label="Description"
                    object-id="txt_AppsFormDescription"
                />
                <Input
                    id="txt_AppsFormURL"
                    v-model="form.url"
                    label="URL"
                    placeholder="e.g. https://app.example.com"
                    object-id="txt_AppsFormURL"
                />
                <Input
                    id="txt_AppsFormIcon"
                    v-model="form.icon"
                    label="Icon Name"
                    placeholder="e.g. Box"
                    object-id="txt_AppsFormIcon"
                />
                <div class="flex items-center gap-2 mt-4">
                    <input
                        id="chk_AppsFormIsActive"
                        v-model="form.isActive"
                        data-testid="chk_AppsFormIsActive"
                        type="checkbox"
                        class="rounded border-border text-brand-600 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50"
                    />
                    <label for="chk_AppsFormIsActive" class="text-sm text-text"
                        >Active</label
                    >
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="outline"
                        object-id="btn_AppsFormCancel"
                        @click="isModalOpen = false"
                        >Cancel</Button
                    >
                    <Button
                        type="submit"
                        variant="primary"
                        :disabled="submitting"
                        object-id="btn_AppsFormSave"
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
import { settingsService } from "@/services/settings.service";

const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "url", label: "URL" },
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
    url: "",
    icon: "",
    isActive: true,
});

const tableRows = computed(() => {
    return rows.value.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        url: r.url || "-",
        status: r.isActive ? "Active" : "Inactive",
        original: r,
    }));
});

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await settingsService.fetchList("apps");
        rows.value = response.items || [];
    } catch (err: any) {
        error.value = err.message || "Failed to load apps";
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    form.value = {
        code: "",
        name: "",
        description: "",
        url: "",
        icon: "",
        isActive: true,
    };
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
        url: original.url || "",
        icon: original.icon || "",
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
            await settingsService.update("apps", currentId.value, form.value);
        } else {
            await settingsService.create("apps", form.value);
        }
        isModalOpen.value = false;
        loadData();
    } catch (err: any) {
        alert(err.message || "Failed to save app");
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
