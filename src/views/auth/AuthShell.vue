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
            © {{ new Date().getFullYear() }} ALIR Smart System · All rights
            reserved
        </footer>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    formTitle?: string;
    formSubtitle?: string;
}>();
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
            #ffffff 0%,
            #ffffff 78%,
            rgba(255, 255, 255, 0.97) 84%,
            rgba(255, 255, 255, 0.92) 88%,
            rgba(255, 255, 255, 0.85) 92%,
            rgba(255, 255, 255, 0.72) 95%,
            rgba(255, 255, 255, 0.58) 97%,
            rgba(255, 255, 255, 0.45) 99%,
            rgba(255, 255, 255, 0.35) 100%
        ),
        linear-gradient(90deg, #1d4ed8 0%, #2563eb 45%, #22d3ee 100%);
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
    width: 100%;
    padding: 1.5rem 1.5rem 1.25rem;
    text-align: center;
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.02em;
}
</style>
