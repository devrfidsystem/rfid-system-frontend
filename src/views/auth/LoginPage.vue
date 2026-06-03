<template>
    <AuthShell
        form-title="Masuk ke Control Room"
        form-subtitle="Gunakan akun perusahaan Anda untuk mengakses laporan dan operasi ALIR Smart System."
        aside-title="Koneksi aman industri 4.0"
        aside-description="Single source of truth untuk dashboards, audit, dan access policy dalam satu ruang kerja yang telah distandarisasi."
    >
        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <div>
                    <label
                        class="text-sm font-semibold text-gray-700"
                        for="login-email"
                        >Email perusahaan</label
                    >
                    <input
                        id="login-email"
                        v-model="form.email"
                        type="email"
                        autocomplete="email"
                        class="mt-1.5 w-full rounded-md border border-border-default bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="nama@perusahaan.co.id"
                        @blur="touched.email = true"
                    />
                    <p
                        v-if="touched.email && !isEmailValid"
                        class="mt-1.5 text-xs text-signal-red"
                    >
                        Gunakan email valid perusahaan.
                    </p>
                </div>

                <div>
                    <label
                        class="text-sm font-semibold text-gray-700"
                        for="login-password"
                        >Password</label
                    >
                    <input
                        id="login-password"
                        v-model="form.password"
                        type="password"
                        autocomplete="current-password"
                        class="mt-1.5 w-full rounded-md border border-border-default bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                        placeholder="Minimal 8 karakter"
                        @blur="touched.password = true"
                    />
                    <p
                        v-if="touched.password && !isPasswordValid"
                        class="mt-1.5 text-xs text-signal-red"
                    >
                        Password harus terdiri dari minimal 8 karakter.
                    </p>
                </div>

                <div class="flex items-center justify-between text-sm">
                    <label
                        class="inline-flex items-center gap-2 text-text-secondary cursor-pointer"
                    >
                        <input
                            v-model="form.remember"
                            type="checkbox"
                            class="h-4 w-4 rounded border border-border-default text-primary-600 focus:ring-primary-500"
                        />
                        Ingat saya
                    </label>
                    <RouterLink
                        to="/register"
                        class="font-semibold text-primary-600 hover:text-primary-700"
                        >Belum punya akun?</RouterLink
                    >
                </div>

                <button
                    type="submit"
                    class="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400"
                    :disabled="submitting || !canSubmit"
                >
                    <span v-if="submitting" class="btn-spinner"></span>
                    <span>{{ submitting ? "Memproses..." : "Masuk" }}</span>
                </button>

                <p
                    v-if="status"
                    class="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-signal-red text-center"
                >
                    {{ status }}
                </p>
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AuthShell from "./AuthShell.vue";
import { sessionService } from "@/services/session.service";
import { useAuthStore } from "@/store/auth.store";
import { useNotifier } from "@/composable/useNotifier";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

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
const { withToast } = useNotifier();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmailValid = computed(() => emailPattern.test(form.email));
const isPasswordValid = computed(() => form.password.length >= 8);
const canSubmit = computed(() => isEmailValid.value && isPasswordValid.value);

const toErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "Gagal masuk. Silakan coba lagi.";
};

const handleSubmit = async () => {
    touched.email = true;
    touched.password = true;

    if (!canSubmit.value) {
        status.value = "Lengkapi kolom sebelum melanjutkan.";
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
                await authStore.syncProfile();
            },
            {
                loadingRef: submitting,
                successMessage: "Selamat datang kembali!",
                errorMessage: "Login gagal. Silakan periksa kredensial Anda.",
            },
        );

        const redirectTarget =
            (route.query.redirect as string | undefined) ?? "/dashboard";
        await router.replace(redirectTarget);
    } catch (error) {
        status.value = toErrorMessage(error);
    }
};
</script>
