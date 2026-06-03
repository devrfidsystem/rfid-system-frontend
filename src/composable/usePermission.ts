import { computed } from "vue";
import { useAuthStore } from "@/store/auth.store";

type PermissionState = {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};

const emptyPermission: PermissionState = {
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
};

export function usePermission(menuCode: string) {
    const authStore = useAuthStore();
    const normalizedCode = menuCode.trim().toUpperCase();

    const permission = computed<PermissionState>(() => {
        if (!normalizedCode) {
            return emptyPermission;
        }
        const matched = authStore.permissions.find(
            (item) => item.menuCode.toUpperCase() === normalizedCode,
        );
        return matched?.actions ?? emptyPermission;
    });

    return {
        canView: computed(() => permission.value.canView),
        canCreate: computed(() => permission.value.canCreate),
        canUpdate: computed(() => permission.value.canUpdate),
        canDelete: computed(() => permission.value.canDelete),
    };
}
