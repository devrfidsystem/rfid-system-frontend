<template>
    <AuthShell
        :form-title="t('auth.forgotPassword.title')"
        :form-subtitle="t('auth.forgotPassword.subtitle')"
    >
        <template #default>
            <form
                v-if="!submitted"
                class="space-y-5"
                @submit.prevent="handleSubmit"
            >
                <Input
                    id="txt_ForgotPasswordEmail"
                    v-model="form.email"
                    type="email"
                    :label="t('auth.forgotPassword.emailLabel')"
                    label-class="sr-only"
                    :placeholder="t('auth.forgotPassword.emailPlaceholder')"
                    autocomplete="email"
                    :error="fieldErrors.email"
                    object-id="txt_ForgotPasswordEmail"
                    @blur="touched.email = true"
                />

                <Button
                    type="submit"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="submitting || !canSubmit"
                    object-id="btn_ForgotPasswordSubmit"
                >
                    <span v-if="submitting" class="btn-spinner mr-2"></span>
                    {{
                        submitting
                            ? t("auth.forgotPassword.submitting")
                            : t("auth.forgotPassword.submit")
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

            <InlineAlert
                v-else
                variant="success"
                :description="t('auth.forgotPassword.bannerSuccess')"
                compact
                class="text-xs"
            />

            <p class="mt-6 text-sm text-text-secondary">
                {{ t("auth.forgotPassword.rememberPrompt") }}
                <RouterLink
                    id="lkl_ForgotPasswordBackToLogin"
                    to="/login"
                    data-testid="lkl_ForgotPasswordBackToLogin"
                    class="font-semibold text-primary-600 hover:text-primary-700"
                    >{{ t("auth.forgotPassword.backToLogin") }}</RouterLink
                >
            </p>
        </template>
    </AuthShell>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import AuthShell from "./AuthShell.vue";
import Input from "@/components/atoms/Input.vue";
import Button from "@/components/atoms/Button.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import { useForgotPassword } from "./composables/useForgotPassword";

const {
    form,
    touched,
    submitting,
    submitted,
    status,
    canSubmit,
    fieldErrors,
    handleSubmit,
} = useForgotPassword();

const { t } = useI18n();
</script>
