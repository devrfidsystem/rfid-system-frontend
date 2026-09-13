import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { authService } from "@/services/auth.service";
import { useNotifier } from "@/composable/useNotifier";

function extractAccessTokenFromHash(hash: string): string | null {
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(cleaned);
    return params.get("access_token");
}

export function useResetPassword() {
    const router = useRouter();
    const { withToast } = useNotifier();
    const { t } = useI18n();

    const accessToken = ref<string | null>(null);
    const linkError = ref<string | null>(null);

    const form = reactive({
        password: "",
        confirmPassword: "",
    });

    const touched = reactive({
        password: false,
        confirmPassword: false,
    });

    const submitting = ref(false);
    const status = ref<string | null>(null);

    const isPasswordValid = computed(() => form.password.length >= 10);
    const passwordsMatch = computed(
        () => form.password && form.password === form.confirmPassword,
    );
    const canSubmit = computed(
        () =>
            Boolean(accessToken.value) &&
            isPasswordValid.value &&
            passwordsMatch.value,
    );

    const fieldErrors = computed(() => ({
        password:
            touched.password && !isPasswordValid.value
                ? t("auth.resetPassword.errors.passwordInvalid")
                : undefined,
        confirmPassword:
            touched.confirmPassword && !passwordsMatch.value
                ? t("auth.resetPassword.errors.confirmPasswordMismatch")
                : undefined,
    }));

    onMounted(() => {
        const token = extractAccessTokenFromHash(window.location.hash);
        if (!token) {
            linkError.value = t("auth.resetPassword.errors.invalidLink");
            return;
        }
        accessToken.value = token;
    });

    const handleSubmit = async () => {
        touched.password = true;
        touched.confirmPassword = true;

        if (!canSubmit.value || !accessToken.value) {
            status.value = t("auth.resetPassword.errors.incomplete");
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    await authService.resetPassword(
                        accessToken.value as string,
                        form.password,
                    );
                },
                {
                    loadingRef: submitting,
                    successMessage: t("auth.resetPassword.toastSuccess"),
                    errorMessage: t("auth.resetPassword.toastError"),
                },
            );

            await router.replace("/login");
        } catch (error) {
            status.value =
                error instanceof Error
                    ? error.message
                    : t("auth.resetPassword.errors.invalidLink");
        }
    };

    return {
        form,
        touched,
        submitting,
        status,
        linkError,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
