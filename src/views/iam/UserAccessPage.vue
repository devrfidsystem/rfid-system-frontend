<template>
    <div class="space-y-6">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4"
        >
            <div>
                <h3 class="text-lg font-medium text-gray-900">
                    User Access Management
                </h3>
                <p class="text-sm text-gray-500">
                    Configure roles, companies, and warehouses for users.
                </p>
            </div>

            <div class="w-full sm:w-72">
                <Select
                    v-model="selectedUserId"
                    :options="userOptions"
                    placeholder="Select a User"
                />
            </div>
        </div>

        <div v-if="loadingUsers" class="p-6 text-center text-gray-500">
            <LoadingState :lines="1" />
        </div>
        <div
            v-else-if="!selectedUserId"
            class="p-12 text-center text-gray-500 border rounded-lg bg-gray-50 border-dashed"
        >
            Please select a user from the dropdown above to manage their access.
        </div>
        <div v-else-if="loadingDetails" class="p-6">
            <LoadingState :lines="4" />
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Roles Card -->
            <Card class="md:col-span-1">
                <h4
                    class="text-base font-semibold text-gray-900 mb-4 border-b pb-3"
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
                            />
                        </div>
                        <Button
                            variant="outline"
                            @click="addRole"
                            :disabled="!selectedRole || submitting"
                            >Add</Button
                        >
                    </div>
                    <ul class="space-y-2 mt-4">
                        <li
                            v-for="role in userRoles"
                            :key="role.id"
                            class="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100"
                        >
                            <span class="text-sm font-medium text-gray-700">{{
                                role.name
                            }}</span>
                            <button
                                @click="removeRole(role.id)"
                                class="text-rose-500 hover:text-rose-700 text-xs font-medium"
                                :disabled="submitting"
                            >
                                Remove
                            </button>
                        </li>
                        <li
                            v-if="userRoles.length === 0"
                            class="text-sm text-gray-500 italic text-center py-2"
                        >
                            No roles assigned.
                        </li>
                    </ul>
                </div>
            </Card>

            <!-- Warehouses Card -->
            <Card class="md:col-span-1">
                <h4
                    class="text-base font-semibold text-gray-900 mb-4 border-b pb-3"
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
                            />
                        </div>
                        <Button
                            variant="outline"
                            @click="addWarehouse"
                            :disabled="!selectedWarehouse || submitting"
                            >Add</Button
                        >
                    </div>
                    <ul class="space-y-2 mt-4">
                        <li
                            v-for="wh in userWarehouses"
                            :key="wh.id"
                            class="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100"
                        >
                            <span class="text-sm font-medium text-gray-700">{{
                                wh.name || wh.warehouseId || wh.id
                            }}</span>
                            <button
                                @click="
                                    removeWarehouse(wh.warehouseId || wh.id)
                                "
                                class="text-rose-500 hover:text-rose-700 text-xs font-medium"
                                :disabled="submitting"
                            >
                                Remove
                            </button>
                        </li>
                        <li
                            v-if="userWarehouses.length === 0"
                            class="text-sm text-gray-500 italic text-center py-2"
                        >
                            No warehouses assigned.
                        </li>
                    </ul>
                </div>
            </Card>

            <!-- Companies Card -->
            <Card class="md:col-span-1">
                <h4
                    class="text-base font-semibold text-gray-900 mb-4 border-b pb-3"
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
                            />
                        </div>
                        <Button
                            variant="outline"
                            @click="addCompany"
                            :disabled="!selectedCompany || submitting"
                            >Add</Button
                        >
                    </div>
                    <ul class="space-y-2 mt-4">
                        <li
                            v-for="comp in userCompanies"
                            :key="comp.id"
                            class="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100"
                        >
                            <span class="text-sm font-medium text-gray-700">{{
                                comp.name || comp.companyId || comp.id
                            }}</span>
                            <!-- Company removal might not be supported via API, hiding remove button for safety -->
                        </li>
                        <li
                            v-if="userCompanies.length === 0"
                            class="text-sm text-gray-500 italic text-center py-2"
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
import { ref, onMounted, watch } from "vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Select from "@/components/atoms/Select.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import { iamService } from "@/services/iam.service";
import { settingsService } from "@/services/settings.service";
import { masterService } from "@/services/master.service";

const users = ref<any[]>([]);
const userOptions = ref<{ label: string; value: string }[]>([]);
const selectedUserId = ref("");
const loadingUsers = ref(true);

const loadingDetails = ref(false);
const submitting = ref(false);

const userRoles = ref<any[]>([]);
const userWarehouses = ref<any[]>([]);
const userCompanies = ref<any[]>([]);

const roleOptions = ref<{ label: string; value: string }[]>([]);
const warehouseOptions = ref<{ label: string; value: string }[]>([]);
const companyOptions = ref<{ label: string; value: string }[]>([]);

const selectedRole = ref("");
const selectedWarehouse = ref("");
const selectedCompany = ref("");

const loadDropdowns = async () => {
    try {
        const [roles, whRes, compRes] = await Promise.all([
            iamService.getRoles(),
            masterService.fetchList("warehouses", { limit: 100 }),
            settingsService.fetchList("companies"),
        ]);

        roleOptions.value = roles.map((r: any) => ({
            label: r.name,
            value: String(r.id),
        }));
        warehouseOptions.value = whRes.items.map((w: any) => ({
            label: `${w.code} - ${w.name}`,
            value: String(w.id),
        }));
        companyOptions.value = compRes.items.map((c: any) => ({
            label: c.name,
            value: String(c.id),
        }));
    } catch (e) {
        console.error("Failed to load options", e);
    }
};

const loadUsers = async () => {
    loadingUsers.value = true;
    try {
        const response = await iamService.getUsers();
        users.value = response;
        userOptions.value = users.value.map((u) => ({
            label: u.email || u.name || String(u.id),
            value: String(u.id),
        }));
    } catch (err) {
        console.error("Failed to load users", err);
    } finally {
        loadingUsers.value = false;
    }
};

const loadUserDetails = async () => {
    if (!selectedUserId.value) return;
    loadingDetails.value = true;
    try {
        const user = await iamService.getUser(selectedUserId.value);
        // Assuming backend populates roles, userWarehouses, userCompanies in the user object
        userRoles.value = user.roles || [];
        userWarehouses.value = user.warehouses || user.userWarehouses || [];
        userCompanies.value = user.companies || user.userCompanies || [];
    } catch (err) {
        console.error("Failed to load user details", err);
        // Fallback: Just clear if error
        userRoles.value = [];
        userWarehouses.value = [];
        userCompanies.value = [];
    } finally {
        loadingDetails.value = false;
    }
};

watch(selectedUserId, () => {
    loadUserDetails();
});

const addRole = async () => {
    if (!selectedRole.value) return;
    submitting.value = true;
    try {
        await iamService.assignUserRole(
            selectedUserId.value,
            selectedRole.value,
        );
        await loadUserDetails();
        selectedRole.value = "";
    } catch (e: any) {
        alert(e.message || "Failed to add role");
    } finally {
        submitting.value = false;
    }
};

const removeRole = async (roleId: string) => {
    if (!confirm("Remove this role?")) return;
    submitting.value = true;
    try {
        await iamService.removeUserRole(selectedUserId.value, roleId);
        await loadUserDetails();
    } catch (e: any) {
        alert(e.message || "Failed to remove role");
    } finally {
        submitting.value = false;
    }
};

const addWarehouse = async () => {
    if (!selectedWarehouse.value) return;
    submitting.value = true;
    try {
        await iamService.assignUserWarehouse(
            selectedUserId.value,
            selectedWarehouse.value,
        );
        await loadUserDetails();
        selectedWarehouse.value = "";
    } catch (e: any) {
        alert(e.message || "Failed to add warehouse");
    } finally {
        submitting.value = false;
    }
};

const removeWarehouse = async (warehouseId: string) => {
    if (!confirm("Remove warehouse access?")) return;
    submitting.value = true;
    try {
        await iamService.removeUserWarehouse(selectedUserId.value, warehouseId);
        await loadUserDetails();
    } catch (e: any) {
        alert(e.message || "Failed to remove warehouse");
    } finally {
        submitting.value = false;
    }
};

const addCompany = async () => {
    if (!selectedCompany.value) return;
    submitting.value = true;
    try {
        await iamService.assignUserCompany(
            selectedUserId.value,
            selectedCompany.value,
        );
        await loadUserDetails();
        selectedCompany.value = "";
    } catch (e: any) {
        alert(e.message || "Failed to add company");
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    loadDropdowns();
    loadUsers();
});
</script>
