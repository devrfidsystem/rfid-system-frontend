import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authService } from "@/services/auth.service";
import { useNotifier } from "@/composable/useNotifier";

export function useForgotPassword() {
    const { withToast } = useNotifier();
    const { t } = useI18n();

    const form = reactive({
        email: "",
    });

    const touched = reactive({
        email: false,
    });

    const submitting = ref(false);
    const submitted = ref(false);
    const status = ref<string | null>(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = computed(() => emailPattern.test(form.email));
    const canSubmit = computed(() => isEmailValid.value);

    const fieldErrors = computed(() => ({
        email:
            touched.email && !isEmailValid.value
                ? t("auth.forgotPassword.errors.emailInvalid")
                : undefined,
    }));

    const handleSubmit = async () => {
        touched.email = true;

        if (!canSubmit.value) {
            status.value = t("auth.forgotPassword.errors.emailRequired");
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    await authService.forgotPassword(form.email.trim());
                },
                {
                    loadingRef: submitting,
                    successMessage: t("auth.forgotPassword.toastSuccess"),
                    errorMessage: t("auth.forgotPassword.toastError"),
                },
            );

            // The backend always resolves regardless of whether the email is
            // registered, so reaching here never confirms account existence.
            submitted.value = true;
        } catch {
            status.value = t("auth.forgotPassword.unexpectedError");
        }
    };

    return {
        form,
        touched,
        submitting,
        submitted,
        status,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
