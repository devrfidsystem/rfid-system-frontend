<template>
    <AuthShell
        form-title="Masuk ke Control Room"
        form-subtitle="Gunakan akun perusahaan Anda untuk mengakses laporan dan operasi warehouse."
        aside-title="Satu portal untuk seluruh operasi gudang"
        aside-description="Monitoring stok, transaksi, dan RFID tracking dalam satu ruang kerja yang aman dan terintegrasi."
    >
        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_LoginEmail"
                    v-model="form.email"
                    type="email"
                    label="Email perusahaan"
                    placeholder="nama@perusahaan.co.id"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_LoginEmail"
                    @blur="touched.email = true"
                />

                <Input
                    id="txt_LoginPassword"
                    v-model="form.password"
                    type="password"
                    label="Password"
                    placeholder="Minimal 8 karakter"
                    autocomplete="current-password"
                    :error="fieldErrors.password"
                    object-id="txt_LoginPassword"
                    @blur="touched.password = true"
                />

                <div class="flex items-center justify-between text-sm">
                    <label
                        class="inline-flex items-center gap-2 text-slate-500 cursor-pointer"
                    >
                        <input
                            id="chk_LoginRememberMe"
                            v-model="form.remember"
                            data-testid="chk_LoginRememberMe"
                            type="checkbox"
                            class="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        Ingat saya
                    </label>
                    <RouterLink
                        id="lkl_LoginRegister"
                        to="/register"
                        data-testid="lkl_LoginRegister"
                        class="font-semibold text-brand-600 hover:text-brand-700"
                        >Belum punya akun?</RouterLink
                    >
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_LoginSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{ submitting ? "Memproses..." : "Masuk" }}
                </Button>

                <p
                    v-if="status"
                    class="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-rose-500 text-center"
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
import { useLogin } from "./composables/useLogin";

const {
    form,
    touched,
    submitting,
    status,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useLogin();
</script>
