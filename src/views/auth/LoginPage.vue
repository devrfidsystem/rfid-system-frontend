<template>
    <AuthShell>
        <template #subtitle>
            Belum punya akun?
            <RouterLink
                id="lkl_LoginRegister"
                to="/register"
                data-testid="lkl_LoginRegister"
                class="font-semibold text-primary-600 hover:text-primary-700"
                >Daftar</RouterLink
            >
        </template>

        <template #default>
            <form class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_LoginEmail"
                    v-model="form.email"
                    type="email"
                    label="Email perusahaan"
                    label-class="sr-only"
                    placeholder="nama@perusahaan.co.id"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_LoginEmail"
                    @blur="touched.email = true"
                />

                <Input
                    id="txt_LoginPassword"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    label="Password"
                    label-class="sr-only"
                    placeholder="Minimal 8 karakter"
                    autocomplete="current-password"
                    :error="fieldErrors.password"
                    object-id="txt_LoginPassword"
                    @blur="touched.password = true"
                >
                    <template #trailingIcon>
                        <button
                            type="button"
                            class="text-text-secondary hover:text-text"
                            :aria-label="
                                showPassword
                                    ? 'Sembunyikan password'
                                    : 'Tampilkan password'
                            "
                            @click="showPassword = !showPassword"
                        >
                            <Icon
                                :icon="showPassword ? EyeOff : Eye"
                                :size="16"
                            />
                        </button>
                    </template>
                </Input>

                <CheckboxField
                    v-model="form.remember"
                    label="Ingat saya"
                    object-id="chk_LoginRememberMe"
                />

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

                <InlineAlert
                    v-if="status"
                    variant="error"
                    :description="status"
                    compact
                    class="text-xs"
                />
            </form>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { Eye, EyeOff } from "lucide-vue-next";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import CheckboxField from "@/components/ui/form/CheckboxField.vue";
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

const showPassword = ref(false);
</script>
