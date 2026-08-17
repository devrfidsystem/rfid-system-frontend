import { computed, reactive, ref, watch } from "vue";
import { iamService } from "@/services/iam.service";
import { settingsService } from "@/services/settings.service";
import { useNotifier } from "@/composable/useNotifier";

export interface MenuTreeRecord {
    id: string;
    name: string;
    sort_order?: number;
    children?: MenuTreeRecord[];
}

interface MenuGrant {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export function useRoleMenus() {
    const { withToast, notifyError } = useNotifier();

    const roleOptions = ref<{ label: string; value: string }[]>([]);
    const selectedRoleId = ref("");
    const loadingRoles = ref(true);

    const appOptions = ref<{ label: string; value: string }[]>([]);
    const selectedAppId = ref("");
    const loadingApps = ref(true);

    const menuTree = ref<MenuTreeRecord[]>([]);
    const loadingTree = ref(false);

    const grants = reactive(new Map<string, MenuGrant>());
    const loadingGrants = ref(false);
    const pendingMenuIds = reactive(new Set<string>());

    const isGranted = (menuId: string) => grants.has(menuId);
    const getGrant = (menuId: string): MenuGrant =>
        grants.get(menuId) ?? {
            canView: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
        };

    const loadRoles = async () => {
        loadingRoles.value = true;
        try {
            const roles = await iamService.getRoles();
            roleOptions.value = (
                roles as Array<{ id: string; name: string }>
            ).map((r) => ({ label: r.name, value: String(r.id) }));
        } catch (err) {
            notifyError(
                err instanceof Error ? err.message : "Failed to load roles",
            );
        } finally {
            loadingRoles.value = false;
        }
    };

    const loadApps = async () => {
        loadingApps.value = true;
        try {
            const response = await settingsService.fetchList("apps");
            appOptions.value = (
                response.items as Array<{ id: string; name: string }>
            ).map((app) => ({ label: app.name, value: String(app.id) }));
            if (appOptions.value.length > 0) {
                selectedAppId.value = appOptions.value[0].value;
            }
        } catch (err) {
            notifyError(
                err instanceof Error ? err.message : "Failed to load apps",
            );
        } finally {
            loadingApps.value = false;
        }
    };

    const loadMenuTree = async () => {
        if (!selectedAppId.value) return;
        loadingTree.value = true;
        try {
            const tree = await settingsService.getAppMenuTree(
                selectedAppId.value,
            );
            menuTree.value = tree as unknown as MenuTreeRecord[];
        } catch (err) {
            notifyError(
                err instanceof Error ? err.message : "Failed to load menus",
            );
            menuTree.value = [];
        } finally {
            loadingTree.value = false;
        }
    };

    const loadGrants = async () => {
        if (!selectedRoleId.value) return;
        loadingGrants.value = true;
        try {
            const rows = await iamService.getRoleMenus(selectedRoleId.value);
            grants.clear();
            for (const row of rows as Array<{
                menuId: string;
                canView: boolean;
                canCreate: boolean;
                canUpdate: boolean;
                canDelete: boolean;
            }>) {
                grants.set(row.menuId, {
                    canView: row.canView,
                    canCreate: row.canCreate,
                    canUpdate: row.canUpdate,
                    canDelete: row.canDelete,
                });
            }
        } catch (err) {
            notifyError(
                err instanceof Error
                    ? err.message
                    : "Failed to load role permissions",
            );
            grants.clear();
        } finally {
            loadingGrants.value = false;
        }
    };

    watch(selectedAppId, () => {
        void loadMenuTree();
    });

    watch(selectedRoleId, () => {
        void loadGrants();
    });

    const toggleAccess = async (menuId: string, next: boolean) => {
        pendingMenuIds.add(menuId);
        try {
            await withToast(
                async () => {
                    if (next) {
                        await iamService.assignMenuToRole(
                            selectedRoleId.value,
                            menuId,
                        );
                        grants.set(menuId, {
                            canView: true,
                            canCreate: false,
                            canUpdate: false,
                            canDelete: false,
                        });
                    } else {
                        await iamService.removeMenuFromRole(
                            selectedRoleId.value,
                            menuId,
                        );
                        grants.delete(menuId);
                    }
                },
                {
                    successMessage: next
                        ? "Akses menu diberikan"
                        : "Akses menu dicabut",
                    errorMessage: "Gagal memperbarui akses menu",
                },
            );
        } finally {
            pendingMenuIds.delete(menuId);
        }
    };

    const togglePermission = async (
        menuId: string,
        key: "canCreate" | "canUpdate" | "canDelete",
        next: boolean,
    ) => {
        const current = getGrant(menuId);
        pendingMenuIds.add(menuId);
        try {
            await withToast(
                async () => {
                    await iamService.assignMenuToRole(
                        selectedRoleId.value,
                        menuId,
                        {
                            canCreate:
                                key === "canCreate" ? next : current.canCreate,
                            canUpdate:
                                key === "canUpdate" ? next : current.canUpdate,
                            canDelete:
                                key === "canDelete" ? next : current.canDelete,
                        },
                    );
                    grants.set(menuId, { ...current, [key]: next });
                },
                {
                    successMessage: "Permission diperbarui",
                    errorMessage: "Gagal memperbarui permission",
                },
            );
        } finally {
            pendingMenuIds.delete(menuId);
        }
    };

    const canManage = computed(
        () => Boolean(selectedRoleId.value) && !loadingGrants.value,
    );

    return {
        roleOptions,
        selectedRoleId,
        loadingRoles,
        appOptions,
        selectedAppId,
        loadingApps,
        menuTree,
        loadingTree,
        loadingGrants,
        pendingMenuIds,
        canManage,
        isGranted,
        getGrant,
        loadRoles,
        loadApps,
        toggleAccess,
        togglePermission,
    };
}
