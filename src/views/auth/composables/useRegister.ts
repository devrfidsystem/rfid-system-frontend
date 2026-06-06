import { reactive, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useNotifier } from "@/composable/useNotifier";
import { authService } from "@/services/auth.service";

export function useRegister() {
    const router = useRouter();
    const { withToast } = useNotifier();

    const form = reactive({
        fullName: "",
        company: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
    });

    type TouchState = {
        fullName: boolean;
        company: boolean;
        email: boolean;
        password: boolean;
        confirmPassword: boolean;
        terms: boolean;
    };

    const touched = reactive<TouchState>({
        fullName: false,
        company: false,
        email: false,
        password: false,
        confirmPassword: false,
        terms: false,
    });

    const submitting = ref(false);
    const status = ref<string | null>(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = computed(() => emailPattern.test(form.email));
    const isPasswordValid = computed(() => form.password.length >= 10);
    const passwordsMatch = computed(
        () => form.password && form.password === form.confirmPassword,
    );
    const canSubmit = computed(
        () =>
            form.fullName &&
            form.company &&
            isEmailValid.value &&
            isPasswordValid.value &&
            passwordsMatch.value &&
            form.terms,
    );

    const fieldErrors = computed(() => ({
        fullName:
            touched.fullName && !form.fullName
                ? "Nama tidak boleh kosong."
                : undefined,
        company:
            touched.company && !form.company
                ? "Isi nama unit atau perusahaan."
                : undefined,
        email:
            touched.email && !isEmailValid.value
                ? "Pastikan email valid perusahaan."
                : undefined,
        password:
            touched.password && !isPasswordValid.value
                ? "Password minimal 10 karakter."
                : undefined,
        confirmPassword:
            touched.confirmPassword && !passwordsMatch.value
                ? "Password harus cocok."
                : undefined,
        terms:
            touched.terms && !form.terms
                ? "Centang untuk melanjutkan."
                : undefined,
    }));

    const handleSubmit = async () => {
        (Object.keys(touched) as Array<keyof TouchState>).forEach((key) => {
            touched[key] = true;
        });

        if (!canSubmit.value) {
            status.value = "Periksa kembali data registrasi Anda.";
            return;
        }

        status.value = null;

        try {
            await withToast(
                async () => {
                    await authService.register({
                        fullName: form.fullName.trim(),
                        companyName: form.company.trim(),
                        email: form.email.trim(),
                        password: form.password,
                    });
                },
                {
                    loadingRef: submitting,
                    successMessage: "Registrasi berhasil! Silakan masuk dengan akun Anda.",
                    errorMessage: "Gagal mendaftar. Silakan coba lagi nanti.",
                }
            );
            await router.replace("/login");
        } catch (error: any) {
            status.value = error.message || "Gagal mendaftar.";
        }
    };

    return {
        form,
        touched,
        submitting,
        status,
        isEmailValid,
        isPasswordValid,
        passwordsMatch,
        canSubmit,
        fieldErrors,
        handleSubmit,
    };
}
