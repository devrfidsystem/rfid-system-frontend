import { ref, watch } from "vue";
import { iamService } from "@/services/iam.service";
import { settingsService } from "@/services/settings.service";
import { masterService } from "@/services/master.service";
import { useNotifier } from "@/composable/useNotifier";

export function useUserAccess() {
    const { withToast, notifyError } = useNotifier();

    const users = ref<Array<{ id: string; email?: string; name?: string }>>([]);
    const userOptions = ref<{ label: string; value: string }[]>([]);
    const selectedUserId = ref("");
    const loadingUsers = ref(true);

    const loadingDetails = ref(false);
    const submitting = ref(false);

    const userRoles = ref<Array<{ id: string; name: string }>>([]);
    const userWarehouses = ref<
        Array<{ id: string; warehouseId?: string; name?: string }>
    >([]);
    const userCompanies = ref<
        Array<{ id: string; companyId?: string; name?: string }>
    >([]);

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

            roleOptions.value = (
                roles as Array<{ id: string; name: string }>
            ).map((r) => ({
                label: r.name,
                value: String(r.id),
            }));

            warehouseOptions.value = (
                whRes.items as Array<{ id: string; code: string; name: string }>
            ).map((w) => ({
                label: `${w.code} - ${w.name}`,
                value: String(w.id),
            }));

            companyOptions.value = (
                compRes.items as Array<{ id: string; name: string }>
            ).map((c) => ({
                label: c.name,
                value: String(c.id),
            }));
        } catch (e) {
            notifyError(
                e instanceof Error ? e.message : "Failed to load options",
            );
        }
    };

    const loadUsers = async () => {
        loadingUsers.value = true;
        try {
            const response = await iamService.getUsers();
            users.value = response as Array<{
                id: string;
                email?: string;
                name?: string;
            }>;
            userOptions.value = users.value.map((u) => ({
                label: u.email || u.name || String(u.id),
                value: String(u.id),
            }));
        } catch (err) {
            notifyError(
                err instanceof Error ? err.message : "Failed to load users",
            );
        } finally {
            loadingUsers.value = false;
        }
    };

    const loadUserDetails = async () => {
        if (!selectedUserId.value) return;
        loadingDetails.value = true;
        try {
            const user = await iamService.getUser(selectedUserId.value);
            userRoles.value = (user.roles || []) as Array<{
                id: string;
                name: string;
            }>;
            userWarehouses.value = (user.warehouses ||
                user.userWarehouses ||
                []) as Array<{
                id: string;
                warehouseId?: string;
                name?: string;
            }>;
            userCompanies.value = (user.companies ||
                user.userCompanies ||
                []) as Array<{ id: string; companyId?: string; name?: string }>;
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to load user details",
            );
            userRoles.value = [];
            userWarehouses.value = [];
            userCompanies.value = [];
        } finally {
            loadingDetails.value = false;
        }
    };

    watch(selectedUserId, () => {
        void loadUserDetails();
    });

    const addRole = async () => {
        if (!selectedRole.value) return;
        submitting.value = true;
        try {
            await withToast(
                async () => {
                    await iamService.assignUserRole(
                        selectedUserId.value,
                        selectedRole.value,
                    );
                },
                {
                    successMessage: "Role assigned successfully",
                    errorMessage: "Failed to add role",
                },
            );
            await loadUserDetails();
            selectedRole.value = "";
        } finally {
            submitting.value = false;
        }
    };

    const removeRole = async (roleId: string) => {
        if (!confirm("Remove this role?")) return;
        submitting.value = true;
        try {
            await withToast(
                async () => {
                    await iamService.removeUserRole(
                        selectedUserId.value,
                        roleId,
                    );
                },
                {
                    successMessage: "Role removed successfully",
                    errorMessage: "Failed to remove role",
                },
            );
            await loadUserDetails();
        } finally {
            submitting.value = false;
        }
    };

    const addWarehouse = async () => {
        if (!selectedWarehouse.value) return;
        submitting.value = true;
        try {
            await withToast(
                async () => {
                    await iamService.assignUserWarehouse(
                        selectedUserId.value,
                        selectedWarehouse.value,
                    );
                },
                {
                    successMessage: "Warehouse access granted successfully",
                    errorMessage: "Failed to add warehouse",
                },
            );
            await loadUserDetails();
            selectedWarehouse.value = "";
        } finally {
            submitting.value = false;
        }
    };

    const removeWarehouse = async (warehouseId: string) => {
        if (!confirm("Remove warehouse access?")) return;
        submitting.value = true;
        try {
            await withToast(
                async () => {
                    await iamService.removeUserWarehouse(
                        selectedUserId.value,
                        warehouseId,
                    );
                },
                {
                    successMessage: "Warehouse access removed successfully",
                    errorMessage: "Failed to remove warehouse",
                },
            );
            await loadUserDetails();
        } finally {
            submitting.value = false;
        }
    };

    const addCompany = async () => {
        if (!selectedCompany.value) return;
        submitting.value = true;
        try {
            await withToast(
                async () => {
                    await iamService.assignUserCompany(
                        selectedUserId.value,
                        selectedCompany.value,
                    );
                },
                {
                    successMessage: "Company assigned successfully",
                    errorMessage: "Failed to add company",
                },
            );
            await loadUserDetails();
            selectedCompany.value = "";
        } finally {
            submitting.value = false;
        }
    };

    return {
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
        loadDropdowns,
        loadUsers,
        addRole,
        removeRole,
        addWarehouse,
        removeWarehouse,
        addCompany,
    };
}
