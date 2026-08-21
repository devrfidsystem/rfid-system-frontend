<template>
    <div class="auth-page">
        <div class="auth-page__main">
            <div class="auth-page__container">
                <img
                    src="@/assets/image.png"
                    alt="ALIR Smart System"
                    class="auth-card__logo"
                />
                <h1 v-if="formTitle" class="auth-card__title">
                    {{ formTitle }}
                </h1>
                <p
                    v-if="formSubtitle || $slots.subtitle"
                    class="auth-card__subtitle"
                >
                    <slot name="subtitle">{{ formSubtitle }}</slot>
                </p>

                <div class="auth-card__body">
                    <slot />
                </div>
            </div>
        </div>

        <footer class="auth-page__footer">
            {{ t("auth.shell.footer", { year: new Date().getFullYear() }) }}
        </footer>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
    formTitle?: string;
    formSubtitle?: string;
}>();

const { t } = useI18n();
</script>

<style scoped>
.auth-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background:
        linear-gradient(
            to bottom,
            rgb(var(--surface)) 0%,
            rgb(var(--surface)) 78%,
            rgb(var(--surface) / 0.97) 84%,
            rgb(var(--surface) / 0.92) 88%,
            rgb(var(--surface) / 0.85) 92%,
            rgb(var(--surface) / 0.72) 95%,
            rgb(var(--surface) / 0.58) 97%,
            rgb(var(--surface) / 0.45) 99%,
            rgb(var(--surface) / 0.35) 100%
        ),
        linear-gradient(
            90deg,
            var(--brand-gradient-from) 0%,
            var(--brand-gradient-via) 45%,
            var(--brand-gradient-to) 100%
        );
}

.auth-page__main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
}

.auth-page__container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.auth-card__logo {
    height: 40px;
    width: auto;
    margin-bottom: 1.5rem;
}

.auth-card__title {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.3;
    color: rgb(var(--text));
    letter-spacing: 0;
}

.auth-card__subtitle {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: rgb(var(--text-secondary));
}

.auth-card__body {
    margin-top: 2rem;
    width: 100%;
    text-align: start;
}

.auth-page__footer {
    width: 100%;
    padding: 1.5rem 1.5rem 1.25rem;
    text-align: center;
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0;
}
</style>
