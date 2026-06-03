import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth.store";

export function useProfile() {
    const router = useRouter();
    const authStore = useAuthStore();
    const processing = ref(false);
    const status = ref<string | null>(null);

    const profile = computed(() => authStore.profile);
    const permissions = computed(() => profile.value?.permissions ?? []);
    const menuTreeCount = computed(() => profile.value?.menuTree?.length ?? 0);
    const currentCompany = computed(
        () =>
            profile.value?.companies.find(
                (company) =>
                    company.companyId === profile.value?.currentCompanyId,
            ) ?? null,
    );

    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        return "Gagal memproses permintaan.";
    };

    const handleLogout = async () => {
        processing.value = true;
        status.value = null;
        try {
            await authStore.logout();
            await router.replace("/login");
        } catch (error) {
            status.value = getErrorMessage(error);
        } finally {
            processing.value = false;
        }
    };

    return {
        profile,
        permissions,
        menuTreeCount,
        currentCompany,
        processing,
        status,
        handleLogout,
    };
}
