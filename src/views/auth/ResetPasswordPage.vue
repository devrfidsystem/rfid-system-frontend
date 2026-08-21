<template>
    <AuthShell
        :form-title="t('auth.resetPassword.title')"
        :form-subtitle="t('auth.resetPassword.subtitle')"
    >
        <template #default>
            <InlineAlert
                v-if="linkError"
                variant="error"
                :description="linkError"
                compact
                class="text-xs"
            />

            <form v-else class="space-y-5" @submit.prevent="handleSubmit">
                <Input
                    id="txt_ResetPasswordPassword"
                    v-model="form.password"
                    type="password"
                    :label="t('auth.resetPassword.passwordLabel')"
                    :placeholder="t('auth.resetPassword.passwordPlaceholder')"
                    autocomplete="new-password"
                    :error="fieldErrors.password"
                    object-id="txt_ResetPasswordPassword"
                    @blur="touched.password = true"
                />

                <Input
                    id="txt_ResetPasswordConfirmPassword"
                    v-model="form.confirmPassword"
                    type="password"
                    :label="t('auth.resetPassword.confirmPasswordLabel')"
                    :placeholder="
                        t('auth.resetPassword.confirmPasswordPlaceholder')
                    "
                    autocomplete="new-password"
                    :error="fieldErrors.confirmPassword"
                    object-id="txt_ResetPasswordConfirmPassword"
                    @blur="touched.confirmPassword = true"
                />

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_ResetPasswordSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{
                        submitting
                            ? t("auth.resetPassword.submitting")
                            : t("auth.resetPassword.submit")
                    }}
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
import { useI18n } from "vue-i18n";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import { useResetPassword } from "./composables/useResetPassword";

const {
    form,
    touched,
    submitting,
    status,
    linkError,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useResetPassword();

const { t } = useI18n();
</script>
