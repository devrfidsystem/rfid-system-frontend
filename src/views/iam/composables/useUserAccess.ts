import { ref, watch } from "vue";
import { iamService } from "@/services/iam.service";
import { settingsService } from "@/services/settings.service";
import { masterService } from "@/services/master.service";
import { useNotifier } from "@/composable/useNotifier";
import { useAuthStore } from "@/store/auth.store";

export function useUserAccess() {
    const { withToast, notifyError } = useNotifier();
    const authStore = useAuthStore();

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

    type ConfirmationAction = "remove-role" | "remove-warehouse";
    type ConfirmationState = {
        action: ConfirmationAction;
        title: string;
        description: string;
        confirmText: string;
        cancelText: string;
        variant: "primary" | "danger";
        subjectId: string;
    };

    const confirmation = ref<ConfirmationState | null>(null);

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
        if (!authStore.currentCompanyId) {
            notifyError("Tidak ada perusahaan aktif untuk menetapkan role.");
            return;
        }
        submitting.value = true;
        try {
            await withToast(
                async () => {
                    await iamService.assignUserRole(
                        selectedUserId.value,
                        selectedRole.value,
                        authStore.currentCompanyId as string,
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

    const openRemoveRoleConfirm = (roleId: string, roleName?: string) => {
        confirmation.value = {
            action: "remove-role",
            title: "Remove Role",
            description: `Remove ${roleName || "this role"} from the selected user?`,
            confirmText: "Remove",
            cancelText: "Back",
            variant: "danger",
            subjectId: roleId,
        };
    };

    const openRemoveWarehouseConfirm = (
        warehouseId: string,
        warehouseName?: string,
    ) => {
        confirmation.value = {
            action: "remove-warehouse",
            title: "Remove Warehouse Access",
            description: `Remove ${warehouseName || "this warehouse access"} from the selected user?`,
            confirmText: "Remove",
            cancelText: "Back",
            variant: "danger",
            subjectId: warehouseId,
        };
    };

    const clearConfirmation = () => {
        confirmation.value = null;
    };

    const executeRemoval = async (
        action: ConfirmationAction,
        subjectId: string,
    ) => {
        submitting.value = true;
        try {
            if (action === "remove-role") {
                await withToast(
                    async () => {
                        await iamService.removeUserRole(
                            selectedUserId.value,
                            subjectId,
                        );
                    },
                    {
                        successMessage: "Role removed successfully",
                        errorMessage: "Failed to remove role",
                    },
                );
            } else {
                await withToast(
                    async () => {
                        await iamService.removeUserWarehouse(
                            selectedUserId.value,
                            subjectId,
                        );
                    },
                    {
                        successMessage: "Warehouse access removed successfully",
                        errorMessage: "Failed to remove warehouse",
                    },
                );
            }
            await loadUserDetails();
        } finally {
            submitting.value = false;
        }
    };

    const confirmRemoval = async () => {
        if (!confirmation.value) return;
        const action = confirmation.value.action;
        const subjectId = confirmation.value.subjectId;
        clearConfirmation();
        await executeRemoval(action, subjectId);
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
    };
}
