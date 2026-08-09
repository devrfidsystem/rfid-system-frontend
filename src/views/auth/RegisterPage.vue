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

                <CheckboxField
                    v-model="form.terms"
                    label="Saya sudah membaca kebijakan keamanan dan siap mengikuti role-based approval sebelum akses diberikan."
                    object-id="chk_RegisterTerms"
                    :error="fieldErrors.terms"
                    align="start"
                    @blur="touched.terms = true"
                />

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

                <div class="text-center text-xs text-text-secondary">
                    <p>Sudah punya akun?</p>
                    <RouterLink
                        id="lkl_RegisterLogin"
                        to="/login"
                        data-testid="lkl_RegisterLogin"
                        class="font-semibold text-primary-600 hover:text-primary-700"
                        >Masuk di sini</RouterLink
                    >
                </div>

                <InlineAlert
                    v-if="status"
                    variant="info"
                    :description="status"
                    compact
                    class="text-xs"
                />
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import CheckboxField from "@/components/ui/form/CheckboxField.vue";
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
