<template>
    <div class="space-y-6">
        <SectionHeader
            title="User Access Management"
            description="Configure roles, companies, and warehouses for users."
            object-id="hdr_UserAccess"
        >
            <div class="w-full sm:w-72">
                <Select
                    v-model="selectedUserId"
                    :options="userOptions"
                    placeholder="Select a User"
                    object-id="cmb_UserAccessSelectUser"
                />
            </div>
        </SectionHeader>

        <ConfirmDialog
            v-model="confirmationOpen"
            :title="confirmation?.title || 'Confirm Action'"
            :description="confirmation?.description || ''"
            :confirm-text="confirmation?.confirmText || 'Confirm'"
            :cancel-text="confirmation?.cancelText || 'Cancel'"
            :variant="confirmation?.variant || 'danger'"
            :loading="submitting"
            persistent
            object-id="dlg_UserAccessConfirm"
            @confirm="confirmRemoval"
            @cancel="clearConfirmation"
        />

        <div v-if="loadingUsers" class="p-6 text-center text-text-secondary">
            <LoadingState :lines="1" />
        </div>
        <div
            v-else-if="!selectedUserId"
            class="p-12 text-center text-text-secondary border rounded-md bg-surface-secondary/50 border-dashed border-border"
        >
            Please select a user from the dropdown above to manage their access.
        </div>
        <div v-else-if="loadingDetails" class="p-6">
            <LoadingState :lines="4" />
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AccessAssignmentCard
                v-model="selectedRole"
                title="Assigned Roles"
                select-label="Add Role"
                select-placeholder="Select role"
                empty-text="No roles assigned."
                object-id-prefix="UserAccessRole"
                card-class="md:col-span-1"
                :options="roleOptions"
                :items="roleItems"
                :add-disabled="!selectedRole || submitting"
                :submitting="submitting"
                @add="addRole"
                @remove="
                    (item) =>
                        openRemoveRoleConfirm(
                            item.subjectId ?? item.id,
                            item.label,
                        )
                "
            />

            <AccessAssignmentCard
                v-model="selectedWarehouse"
                title="Warehouse Access"
                select-label="Grant Access"
                select-placeholder="Select warehouse"
                empty-text="No warehouses assigned."
                object-id-prefix="UserAccessWarehouse"
                card-class="md:col-span-1"
                :options="warehouseOptions"
                :items="warehouseItems"
                :add-disabled="!selectedWarehouse || submitting"
                :submitting="submitting"
                @add="addWarehouse"
                @remove="
                    (item) =>
                        openRemoveWarehouseConfirm(
                            item.subjectId ?? item.id,
                            item.label,
                        )
                "
            />

            <AccessAssignmentCard
                v-model="selectedCompany"
                title="Company Affiliation"
                select-label="Assign Company"
                select-placeholder="Select company"
                empty-text="No companies assigned."
                object-id-prefix="UserAccessCompany"
                card-class="md:col-span-1"
                :options="companyOptions"
                :items="companyItems"
                :add-disabled="!selectedCompany || submitting"
                :submitting="submitting"
                :removable="false"
                @add="addCompany"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import Select from "@/components/atoms/Select.vue";
import SectionHeader from "@/components/molecules/SectionHeader.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import ConfirmDialog from "@/components/organisms/ConfirmDialog.vue";
import { useUserAccess } from "./composables/useUserAccess";
import AccessAssignmentCard, {
    type AccessAssignmentItem,
} from "./components/AccessAssignmentCard.vue";

const {
    userOptions,
    selectedUserId,
    loadingUsers,
    loadingDetails,
    submitting,
    userRoles,
    userWarehouses,
    userCompanies,
    roleOptions,
    warehouseOptions,
    companyOptions,
    selectedRole,
    selectedWarehouse,
    selectedCompany,
    confirmation,
    loadDropdowns,
    loadUsers,
    addRole,
    openRemoveRoleConfirm,
    addWarehouse,
    openRemoveWarehouseConfirm,
    addCompany,
    clearConfirmation,
    confirmRemoval,
} = useUserAccess();

const confirmationOpen = computed({
    get: () => Boolean(confirmation.value),
    set: (value: boolean) => {
        if (!value) clearConfirmation();
    },
});

const roleItems = computed<AccessAssignmentItem[]>(() =>
    userRoles.value.map((role) => ({
        id: role.id,
        label: role.name,
        subjectId: role.id,
    })),
);

const warehouseItems = computed<AccessAssignmentItem[]>(() =>
    userWarehouses.value.map((warehouse) => ({
        id: warehouse.id,
        label: warehouse.name || warehouse.warehouseId || warehouse.id,
        subjectId: warehouse.warehouseId || warehouse.id,
    })),
);

const companyItems = computed<AccessAssignmentItem[]>(() =>
    userCompanies.value.map((company) => ({
        id: company.id,
        label: company.name || company.companyId || company.id,
        subjectId: company.companyId || company.id,
    })),
);

onMounted(() => {
    loadDropdowns();
    loadUsers();
});
</script>
