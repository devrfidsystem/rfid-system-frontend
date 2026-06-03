<template>
    <AuthShell
        form-title="Buat akun enterprise"
        form-subtitle="Kelola RF tags, pengguna, dan hak akses dari satu portal yang terstandardisasi."
        aside-title="Akses terkontrol untuk tim operasional"
        aside-description="Sistem ready untuk diintegrasikan ke IAM dan monitoring stack Anda — cukup sambungkan API dan aturan business process."
    >
        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <div>
                    <label
                        class="text-sm font-semibold text-slate-600"
                        for="register-name"
                        >Nama lengkap</label
                    >
                    <input
                        id="register-name"
                        v-model="form.fullName"
                        type="text"
                        autocomplete="name"
                        class="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        placeholder="Nama sesuai KTP atau pass"
                        @blur="touched.fullName = true"
                    />
                    <p
                        v-if="touched.fullName && !form.fullName"
                        class="mt-1 text-xs text-rose-500"
                    >
                        Nama tidak boleh kosong.
                    </p>
                </div>

                <div>
                    <label
                        class="text-sm font-semibold text-slate-600"
                        for="register-company"
                        >Perusahaan / unit</label
                    >
                    <input
                        id="register-company"
                        v-model="form.company"
                        type="text"
                        autocomplete="organization"
                        class="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        placeholder="Contoh: PT. Logistik Nusantara"
                        @blur="touched.company = true"
                    />
                    <p
                        v-if="touched.company && !form.company"
                        class="mt-1 text-xs text-rose-500"
                    >
                        Isi nama unit atau perusahaan.
                    </p>
                </div>

                <div>
                    <label
                        class="text-sm font-semibold text-slate-600"
                        for="register-email"
                        >Email kerja</label
                    >
                    <input
                        id="register-email"
                        v-model="form.email"
                        type="email"
                        autocomplete="email"
                        class="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        placeholder="nama@perusahaan.co.id"
                        @blur="touched.email = true"
                    />
                    <p
                        v-if="touched.email && !isEmailValid"
                        class="mt-1 text-xs text-rose-500"
                    >
                        Pastikan email valid perusahaan.
                    </p>
                </div>

                <div class="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label
                            class="text-sm font-semibold text-slate-600"
                            for="register-password"
                            >Password</label
                        >
                        <input
                            id="register-password"
                            v-model="form.password"
                            type="password"
                            autocomplete="new-password"
                            class="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                            placeholder="Minimal 10 karakter"
                            @blur="touched.password = true"
                        />
                        <p
                            v-if="touched.password && !isPasswordValid"
                            class="mt-1 text-xs text-rose-500"
                        >
                            Password minimal 10 karakter.
                        </p>
                    </div>

                    <div>
                        <label
                            class="text-sm font-semibold text-slate-600"
                            for="register-confirm"
                            >Konfirmasi password</label
                        >
                        <input
                            id="register-confirm"
                            v-model="form.confirmPassword"
                            type="password"
                            autocomplete="new-password"
                            class="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                            placeholder="Ketik ulang password"
                            @blur="touched.confirmPassword = true"
                        />
                        <p
                            v-if="touched.confirmPassword && !passwordsMatch"
                            class="mt-1 text-xs text-rose-500"
                        >
                            Password harus cocok.
                        </p>
                    </div>
                </div>

                <label class="flex items-start gap-3 text-slate-500">
                    <input
                        v-model="form.terms"
                        type="checkbox"
                        class="mt-1 h-4 w-4 rounded border border-slate-300 text-sky-600"
                    />
                    <span class="text-sm leading-relaxed">
                        Saya sudah membaca kebijakan keamanan dan siap mengikuti
                        role-based approval sebelum akses diberikan.
                    </span>
                </label>
                <p
                    v-if="touched.terms && !form.terms"
                    class="text-xs text-rose-500"
                >
                    Centang untuk melanjutkan.
                </p>

                <button
                    type="submit"
                    class="flex w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    :disabled="submitting || !canSubmit"
                >
                    <span
                        v-if="submitting"
                        class="btn-spinner text-white"
                    ></span>
                    <span>{{ submitting ? "Mengecek..." : "Daftar" }}</span>
                </button>

                <div class="text-center text-xs text-slate-500">
                    <p>Sudah punya akun?</p>
                    <RouterLink to="/login" class="font-semibold text-slate-900"
                        >Masuk di sini</RouterLink
                    >
                </div>

                <p
                    v-if="status"
                    class="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"
                >
                    {{ status }}
                </p>
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import AuthShell from "./AuthShell.vue";
import { useRegister } from "./composables/useRegister";

const {
    form,
    touched,
    submitting,
    status,
    isEmailValid,
    isPasswordValid,
    passwordsMatch,
    canSubmit,
    handleSubmit,
} = useRegister();
</script>
