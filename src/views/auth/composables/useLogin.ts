import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { sessionService } from "@/services/session.service";
import { useAuthStore } from "@/store/auth.store";
import { useNotifier } from "@/composable/useNotifier";

export function useLogin() {
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();
    const { withToast } = useNotifier();
    const { t } = useI18n();

    const form = reactive({
        email: "",
        password: "",
        remember: true,
    });

    const touched = reactive({
        email: false,
        password: false,
    });

    const submitting = ref(false);
    const status = ref<string | null>(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isEmailValid = computed(() => emailPattern.test(form.email));
    const isPasswordValid = computed(() => form.password.length >= 8);
    const canSubmit = computed(
        () => isEmailValid.value && isPasswordValid.value,
    );

    const fieldErrors = computed(() => ({
        email:
            touched.email && !isEmailValid.value
                ? t("auth.login.errors.emailInvalid")
                : undefined,
        password:
            touched.password && !isPasswordValid.value
                ? t("auth.login.errors.passwordInvalid")
                : undefined,
    }));

    const toErrorMessage = (error: unknown) => {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        return t("auth.login.errors.genericFailure");
    };

    const handleSubmit = async () => {
        touched.email = true;
        touched.password = true;

        if (!canSubmit.value) {
            status.value = t("auth.login.errors.incomplete");
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    const session = await sessionService.signInWithPassword({
                        email: form.email.trim(),
                        password: form.password,
                    });

                    authStore.setSession(session.accessToken);
                    authStore.setProfile(session.profile);
                },
                {
                    loadingRef: submitting,
                    successMessage: t("auth.login.toastSuccess"),
                    errorMessage: t("auth.login.toastError"),
                },
            );

            const redirectTarget =
                (route.query.redirect as string | undefined) ?? "/dashboard";
            await router.replace(redirectTarget);
        } catch (error) {
            status.value = toErrorMessage(error);
        }
    };

    return {
        form,
        touched,
        submitting,
        status,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
