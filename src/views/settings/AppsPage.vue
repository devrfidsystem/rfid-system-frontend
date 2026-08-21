<template>
    <div class="space-y-4">
        <SectionHeader
            title="Applications"
            description="Control app entries used for menu routing and access scope."
            object-id="hdr_SettingsApps"
        >
            <Button
                variant="primary"
                class="w-full justify-center sm:w-auto"
                object-id="btn_AppsNewApp"
                @click="openCreateModal"
            >
                Add App
            </Button>
        </SectionHeader>

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
                                onClick: () =>
                                    openEditModal(row as AppTableRow),
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
                    ? 'Adjust routing metadata and access visibility.'
                    : 'Create an app entry for route and menu assignment.'
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
                <CheckboxField
                    v-model="form.isActive"
                    label="Active"
                    object-id="chk_AppsFormIsActive"
                    class="mt-4"
                />

                <FormActions sticky>
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
                </FormActions>
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
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import CheckboxField from "@/components/ui/form/CheckboxField.vue";
import FormActions from "@/components/ui/form/FormActions.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import SectionHeader from "@/components/molecules/SectionHeader.vue";
import { settingsService } from "@/services/settings.service";
import { useNotifier } from "@/composable/useNotifier";

interface AppRecord extends Record<string, unknown> {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    url?: string | null;
    icon?: string | null;
    isActive?: boolean | null;
}

interface AppTableRow extends Record<string, unknown> {
    id: string;
    code: string;
    name: string;
    url: string;
    status: string;
    original: AppRecord;
}

interface AppForm {
    code: string;
    name: string;
    description: string;
    url: string;
    icon: string;
    isActive: boolean;
}

const { withToast } = useNotifier();

const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "url", label: "URL" },
    { key: "status", label: "Status" },
    { key: "actions", label: "" },
];

const rows = ref<AppRecord[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const currentId = ref("");

const form = ref<AppForm>({
    code: "",
    name: "",
    description: "",
    url: "",
    icon: "",
    isActive: true,
});

const tableRows = computed<AppTableRow[]>(() => {
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
        rows.value = response.items as AppRecord[];
    } catch (err: unknown) {
        error.value =
            err instanceof Error ? err.message : "Failed to load apps";
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

const openEditModal = (row: AppTableRow) => {
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
        await withToast(
            async () => {
                if (isEditing.value) {
                    await settingsService.update(
                        "apps",
                        currentId.value,
                        form.value,
                    );
                } else {
                    await settingsService.create("apps", form.value);
                }
            },
            {
                successMessage: isEditing.value
                    ? "Application updated successfully"
                    : "Application created successfully",
                errorMessage: "Failed to save application",
            },
        );
        isModalOpen.value = false;
        await loadData();
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
