<template>
    <div class="space-y-4">
        <SectionHeader
            title="Roles"
            description="Define role labels used by approval and access assignment."
            object-id="hdr_Roles"
        >
            <Button
                variant="primary"
                class="w-full justify-center sm:w-auto"
                object-id="btn_RolesNewRole"
                @click="openCreateModal"
            >
                Add Role
            </Button>
        </SectionHeader>

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
                                onClick: () =>
                                    openEditModal(row as RoleTableRow),
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
                isEditing
                    ? 'Adjust the role label used in access assignment.'
                    : 'Create a role label for permission assignment.'
            "
            width="md"
            @update:model-value="(v) => (isModalOpen = v)"
        >
            <form class="space-y-6" @submit.prevent="handleSubmit">
                <Input
                    v-if="!isEditing"
                    id="txt_RolesFormCode"
                    v-model="form.code"
                    label="Role Code"
                    placeholder="e.g. SUPER_ADMIN"
                    required
                    object-id="txt_RolesFormCode"
                />
                <Input
                    id="txt_RolesFormName"
                    v-model="form.name"
                    label="Role Name"
                    placeholder="e.g. Super Admin"
                    required
                    object-id="txt_RolesFormName"
                />

                <FormActions sticky>
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
                </FormActions>
            </form>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import SectionHeader from "@/components/molecules/SectionHeader.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import FormActions from "@/components/ui/form/FormActions.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import { iamService } from "@/services/iam.service";
import { useNotifier } from "@/composable/useNotifier";
import { useAuthStore } from "@/store/auth.store";

interface RoleRecord extends Record<string, unknown> {
    id: string;
    code: string;
    name: string;
}

interface RoleTableRow extends Record<string, unknown> {
    id: string;
    code: string;
    name: string;
    original: RoleRecord;
}

interface RoleForm {
    code: string;
    name: string;
}

const { withToast, notifyError } = useNotifier();
const authStore = useAuthStore();

const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Role Name" },
    { key: "actions", label: "" },
];

const rows = ref<RoleRecord[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const currentId = ref("");

const form = ref<RoleForm>({
    code: "",
    name: "",
});

const tableRows = computed<RoleTableRow[]>(() => {
    return rows.value.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        original: r,
    }));
});

const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await iamService.getRoles();
        rows.value = response as RoleRecord[];
    } catch (err: unknown) {
        error.value =
            err instanceof Error ? err.message : "Failed to load roles";
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    form.value = { code: "", name: "" };
    isEditing.value = false;
    currentId.value = "";
    isModalOpen.value = true;
};

const openEditModal = (row: RoleTableRow) => {
    const original = row.original;
    form.value = {
        code: original.code,
        name: original.name,
    };
    isEditing.value = true;
    currentId.value = original.id;
    isModalOpen.value = true;
};

const handleSubmit = async () => {
    if (!isEditing.value && !authStore.currentCompanyId) {
        notifyError("Tidak ada perusahaan aktif untuk membuat role.");
        return;
    }
    submitting.value = true;
    try {
        await withToast(
            async () => {
                if (isEditing.value) {
                    await iamService.updateRole(currentId.value, {
                        name: form.value.name,
                    });
                } else {
                    await iamService.createRole({
                        companyId: authStore.currentCompanyId as string,
                        code: form.value.code
                            .trim()
                            .toUpperCase()
                            .replace(/\s+/g, "_"),
                        name: form.value.name,
                    });
                }
            },
            {
                successMessage: isEditing.value
                    ? "Role updated successfully"
                    : "Role created successfully",
                errorMessage: "Failed to save role",
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
