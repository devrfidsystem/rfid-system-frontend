<template>
    <AuthShell
        form-title="Buat akun enterprise"
        form-subtitle="Kelola RF tags, pengguna, dan hak akses dari satu portal yang terstandardisasi."
        aside-title="Akses terkontrol untuk tim operasional"
        aside-description="Sistem terintegrasi ke IAM dan monitoring stack — cukup sambungkan API dan aturan business process Anda."
    >
        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="register-name"
                    v-model="form.fullName"
                    label="Nama lengkap"
                    placeholder="Nama sesuai KTP atau pass"
                    autocomplete="name"
                    :error="fieldErrors.fullName"
                    @blur="touched.fullName = true"
                />

                <Input
                    id="register-company"
                    v-model="form.company"
                    label="Perusahaan / unit"
                    placeholder="Contoh: PT. Logistik Nusantara"
                    autocomplete="organization"
                    :error="fieldErrors.company"
                    @blur="touched.company = true"
                />

                <Input
                    id="register-email"
                    v-model="form.email"
                    type="email"
                    label="Email kerja"
                    placeholder="nama@perusahaan.co.id"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    @blur="touched.email = true"
                />

                <div class="grid gap-5 sm:grid-cols-2">
                    <Input
                        id="register-password"
                        v-model="form.password"
                        type="password"
                        label="Password"
                        placeholder="Minimal 10 karakter"
                        autocomplete="new-password"
                        :error="fieldErrors.password"
                        @blur="touched.password = true"
                    />

                    <Input
                        id="register-confirm"
                        v-model="form.confirmPassword"
                        type="password"
                        label="Konfirmasi password"
                        placeholder="Ketik ulang password"
                        autocomplete="new-password"
                        :error="fieldErrors.confirmPassword"
                        @blur="touched.confirmPassword = true"
                    />
                </div>

                <div>
                    <label class="flex items-start gap-3 text-slate-500">
                        <input
                            v-model="form.terms"
                            type="checkbox"
                            class="mt-1 h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500"
                            @blur="touched.terms = true"
                        />
                        <span class="text-sm leading-relaxed">
                            Saya sudah membaca kebijakan keamanan dan siap mengikuti
                            role-based approval sebelum akses diberikan.
                        </span>
                    </label>
                    <p
                        v-if="fieldErrors.terms"
                        class="mt-1 text-xs text-rose-500"
                    >
                        {{ fieldErrors.terms }}
                    </p>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{ submitting ? "Mengecek..." : "Daftar" }}
                </Button>

                <div class="text-center text-xs text-slate-500">
                    <p>Sudah punya akun?</p>
                    <RouterLink to="/login" class="font-semibold text-slate-900 hover:text-brand-600"
                        >Masuk di sini</RouterLink
                    >
                </div>

                <p
                    v-if="status"
                    class="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 text-center"
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
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import { useRegister } from "./composables/useRegister";

const {
    form,
    touched,
    submitting,
    status,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useRegister();
</script>
