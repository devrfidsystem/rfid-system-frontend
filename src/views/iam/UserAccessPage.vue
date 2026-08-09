<template>
    <div class="space-y-6">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4"
        >
            <div>
                <h3 class="text-lg font-medium text-text">
                    User Access Management
                </h3>
                <p class="text-sm text-text-secondary">
                    Configure roles, companies, and warehouses for users.
                </p>
            </div>

            <div class="w-full sm:w-72">
                <Select
                    v-model="selectedUserId"
                    :options="userOptions"
                    placeholder="Select a User"
                    object-id="cmb_UserAccessSelectUser"
                />
            </div>
        </div>

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
            <!-- Roles Card -->
            <Card class="md:col-span-1" object-id="wdg_UserAccessRoles">
                <h4
                    class="text-base font-semibold text-text mb-4 border-b border-border pb-3"
                >
                    Assigned Roles
                </h4>
                <div class="space-y-4">
                    <div class="flex gap-2 items-end">
                        <div class="flex-1">
                            <Select
                                v-model="selectedRole"
                                :options="roleOptions"
                                label="Add Role"
                                placeholder="Select role"
                                object-id="cmb_UserAccessAddRole"
                            />
                        </div>
                        <Button
                            variant="outline"
                            :disabled="!selectedRole || submitting"
                            object-id="btn_UserAccessAddRole"
                            @click="addRole"
                            >Add</Button
                        >
                    </div>
                    <ul class="space-y-2 mt-4">
                        <li
                            v-for="role in userRoles"
                            :key="role.id"
                            class="flex justify-between items-center p-3 bg-surface-secondary rounded-md border border-border"
                        >
                            <span class="text-sm font-medium text-text">{{
                                role.name
                            }}</span>
                            <button
                                :id="`btn_UserAccessRemoveRole_Item${role.id}`"
                                class="text-danger-600 hover:text-danger-600/80 text-xs font-medium"
                                :disabled="submitting"
                                :object-id="`btn_UserAccessRemoveRole_Item${role.id}`"
                                @click="
                                    openRemoveRoleConfirm(role.id, role.name)
                                "
                            >
                                Remove
                            </button>
                        </li>
                        <li
                            v-if="userRoles.length === 0"
                            class="text-sm text-text-secondary italic text-center py-2"
                        >
                            No roles assigned.
                        </li>
                    </ul>
                </div>
            </Card>

            <!-- Warehouses Card -->
            <Card class="md:col-span-1" object-id="wdg_UserAccessWarehouses">
                <h4
                    class="text-base font-semibold text-text mb-4 border-b border-border pb-3"
                >
                    Warehouse Access
                </h4>
                <div class="space-y-4">
                    <div class="flex gap-2 items-end">
                        <div class="flex-1">
                            <Select
                                v-model="selectedWarehouse"
                                :options="warehouseOptions"
                                label="Grant Access"
                                placeholder="Select warehouse"
                                object-id="cmb_UserAccessAddWarehouse"
                            />
                        </div>
                        <Button
                            variant="outline"
                            :disabled="!selectedWarehouse || submitting"
                            object-id="btn_UserAccessAddWarehouse"
                            @click="addWarehouse"
                            >Add</Button
                        >
                    </div>
                    <ul class="space-y-2 mt-4">
                        <li
                            v-for="wh in userWarehouses"
                            :key="wh.id"
                            class="flex justify-between items-center p-3 bg-surface-secondary rounded-md border border-border"
                        >
                            <span class="text-sm font-medium text-text">{{
                                wh.name || wh.warehouseId || wh.id
                            }}</span>
                            <button
                                :id="`btn_UserAccessRemoveWarehouse_Item${wh.id}`"
                                class="text-danger-600 hover:text-danger-600/80 text-xs font-medium"
                                :disabled="submitting"
                                :object-id="`btn_UserAccessRemoveWarehouse_Item${wh.id}`"
                                @click="
                                    openRemoveWarehouseConfirm(
                                        wh.warehouseId || wh.id,
                                        wh.name,
                                    )
                                "
                            >
                                Remove
                            </button>
                        </li>
                        <li
                            v-if="userWarehouses.length === 0"
                            class="text-sm text-text-secondary italic text-center py-2"
                        >
                            No warehouses assigned.
                        </li>
                    </ul>
                </div>
            </Card>

            <!-- Companies Card -->
            <Card class="md:col-span-1" object-id="wdg_UserAccessCompanies">
                <h4
                    class="text-base font-semibold text-text mb-4 border-b border-border pb-3"
                >
                    Company Affiliation
                </h4>
                <div class="space-y-4">
                    <div class="flex gap-2 items-end">
                        <div class="flex-1">
                            <Select
                                v-model="selectedCompany"
                                :options="companyOptions"
                                label="Assign Company"
                                placeholder="Select company"
                                object-id="cmb_UserAccessAddCompany"
                            />
                        </div>
                        <Button
                            variant="outline"
                            :disabled="!selectedCompany || submitting"
                            object-id="btn_UserAccessAddCompany"
                            @click="addCompany"
                            >Add</Button
                        >
                    </div>
                    <ul class="space-y-2 mt-4">
                        <li
                            v-for="comp in userCompanies"
                            :key="comp.id"
                            class="flex justify-between items-center p-3 bg-surface-secondary rounded-md border border-border"
                        >
                            <span class="text-sm font-medium text-text">{{
                                comp.name || comp.companyId || comp.id
                            }}</span>
                            <!-- Company removal might not be supported via API, hiding remove button for safety -->
                        </li>
                        <li
                            v-if="userCompanies.length === 0"
                            class="text-sm text-text-secondary italic text-center py-2"
                        >
                            No companies assigned.
                        </li>
                    </ul>
                </div>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Select from "@/components/atoms/Select.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import ConfirmDialog from "@/components/organisms/ConfirmDialog.vue";
import { useUserAccess } from "./composables/useUserAccess";

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

onMounted(() => {
    loadDropdowns();
    loadUsers();
});
</script>
