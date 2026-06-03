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
import { ref, onMounted, computed, watch } from "vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import AppTable from "@/components/organisms/Table.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import { settingsService } from "@/services/settings.service";

const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "path", label: "Path" },
    { key: "sequence", label: "Sequence" },
    { key: "actions", label: "" },
];

const apps = ref<any[]>([]);
const appOptions = ref<{ label: string; value: string }[]>([]);
const selectedAppId = ref("");
const loadingApps = ref(true);

const rows = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const currentId = ref("");

const form = ref({
    appId: "",
    code: "",
    name: "",
    path: "",
    icon: "",
    sequence: "0",
});

const tableRows = computed(() => {
    return rows.value
        .map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            path: r.path || "-",
            sequence: r.sequence || 0,
            original: r,
        }))
        .sort((a, b) => a.sequence - b.sequence);
});

const loadApps = async () => {
    loadingApps.value = true;
    try {
        const response = await settingsService.fetchList("apps");
        apps.value = response.items || [];
        appOptions.value = apps.value.map((app) => ({
            label: app.name,
            value: String(app.id),
        }));
        if (appOptions.value.length > 0) {
            selectedAppId.value = appOptions.value[0].value;
        }
    } catch (err: any) {
        console.error("Failed to load apps", err);
    } finally {
        loadingApps.value = false;
    }
};

const loadMenus = async () => {
    if (!selectedAppId.value) return;
    loading.value = true;
    error.value = null;
    try {
        rows.value = await settingsService.getAppMenus(selectedAppId.value);
    } catch (err: any) {
        error.value = err.message || "Failed to load menus";
        rows.value = [];
    } finally {
        loading.value = false;
    }
};

watch(selectedAppId, () => {
    loadMenus();
});

const openCreateModal = () => {
    form.value = {
        appId: selectedAppId.value,
        code: "",
        name: "",
        path: "",
        icon: "",
        sequence: "0",
    };
    isEditing.value = false;
    currentId.value = "";
    isModalOpen.value = true;
};

const openEditModal = (row: any) => {
    const original = row.original;
    form.value = {
        appId: original.appId || selectedAppId.value,
        code: original.code,
        name: original.name,
        path: original.path || "",
        icon: original.icon || "",
        sequence: String(original.sequence || 0),
    };
    isEditing.value = true;
    currentId.value = original.id;
    isModalOpen.value = true;
};

const handleSubmit = async () => {
    submitting.value = true;
    try {
        const payload = {
            ...form.value,
            sequence: Number(form.value.sequence),
        };
        if (isEditing.value) {
            await settingsService.update("menus", currentId.value, payload);
        } else {
            await settingsService.create("menus", payload);
        }
        isModalOpen.value = false;
        loadMenus();
    } catch (err: any) {
        alert(err.message || "Failed to save menu");
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    loadApps();
});
</script>
