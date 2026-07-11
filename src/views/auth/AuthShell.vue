<template>
    <div class="auth-page">
        <div class="auth-page__container">
            <img
                src="@/assets/image.png"
                alt="ALIR Smart System"
                class="auth-card__logo"
            />
            <h1 class="auth-card__title">{{ formTitle }}</h1>
            <p
                v-if="formSubtitle || $slots.subtitle"
                class="auth-card__subtitle"
            >
                <slot name="subtitle">{{ formSubtitle }}</slot>
            </p>

            <div class="auth-card__body">
                <slot />
            </div>

            <p class="auth-page__footer">
                © {{ new Date().getFullYear() }} ALIR Smart System · All rights
                reserved
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    formTitle: string;
    formSubtitle?: string;
}>();
</script>

<style scoped>
.auth-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
        135deg,
        #ffe8d6 0%,
        #fde2e4 30%,
        #e4d8f5 60%,
        #dbeafe 100%
    );
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
    color: #0f172a;
    letter-spacing: -0.02em;
}

.auth-card__subtitle {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #64748b;
}

.auth-card__body {
    margin-top: 2rem;
    width: 100%;
}

.auth-page__footer {
    margin-top: 2rem;
    font-size: 0.6875rem;
    color: #94a3b8;
    letter-spacing: 0.02em;
}
</style>
