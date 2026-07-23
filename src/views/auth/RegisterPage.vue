<template>
    <AuthShell
        form-title="Buat akun enterprise"
        form-subtitle="Kelola RF tags, pengguna, dan hak akses dari satu portal yang terstandardisasi."
    >
        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_RegisterName"
                    v-model="form.fullName"
                    label="Nama lengkap"
                    placeholder="Nama sesuai KTP atau pass"
                    autocomplete="name"
                    :error="fieldErrors.fullName"
                    object-id="txt_RegisterName"
                    @blur="touched.fullName = true"
                />

                <Input
                    id="txt_RegisterCompany"
                    v-model="form.company"
                    label="Perusahaan / unit"
                    placeholder="Contoh: PT. Logistik Nusantara"
                    autocomplete="organization"
                    :error="fieldErrors.company"
                    object-id="txt_RegisterCompany"
                    @blur="touched.company = true"
                />

                <Input
                    id="txt_RegisterEmail"
                    v-model="form.email"
                    type="email"
                    label="Email kerja"
                    placeholder="nama@perusahaan.co.id"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_RegisterEmail"
                    @blur="touched.email = true"
                />

                <div class="grid gap-5 sm:grid-cols-2">
                    <Input
                        id="txt_RegisterPassword"
                        v-model="form.password"
                        type="password"
                        label="Password"
                        placeholder="Minimal 10 karakter"
                        autocomplete="new-password"
                        :error="fieldErrors.password"
                        object-id="txt_RegisterPassword"
                        @blur="touched.password = true"
                    />

                    <Input
                        id="txt_RegisterConfirmPassword"
                        v-model="form.confirmPassword"
                        type="password"
                        label="Konfirmasi password"
                        placeholder="Ketik ulang password"
                        autocomplete="new-password"
                        :error="fieldErrors.confirmPassword"
                        object-id="txt_RegisterConfirmPassword"
                        @blur="touched.confirmPassword = true"
                    />
                </div>

                <div>
                    <label class="flex items-start gap-3 text-slate-500">
                        <input
                            id="chk_RegisterTerms"
                            v-model="form.terms"
                            data-testid="chk_RegisterTerms"
                            type="checkbox"
                            class="mt-1 h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500"
                            @blur="touched.terms = true"
                        />
                        <span class="text-sm leading-relaxed">
                            Saya sudah membaca kebijakan keamanan dan siap
                            mengikuti role-based approval sebelum akses
                            diberikan.
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
                    object-id="btn_RegisterSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{ submitting ? "Mengecek..." : "Daftar" }}
                </Button>

                <div class="text-center text-xs text-slate-500">
                    <p>Sudah punya akun?</p>
                    <RouterLink
                        id="lkl_RegisterLogin"
                        to="/login"
                        data-testid="lkl_RegisterLogin"
                        class="font-semibold text-slate-900 hover:text-brand-600"
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
