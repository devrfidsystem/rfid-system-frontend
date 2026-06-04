<template>
    <div class="auth-page">
        <!-- Dot grid background -->
        <div class="auth-page__grid"></div>
        <!-- Ambient glow -->
        <div class="auth-page__glow"></div>

        <div class="auth-page__container">
            <div class="auth-card">
                <!-- Left: Brand Hero -->
                <section class="hero">
                    <div class="hero__shimmer"></div>
                    <div class="hero__inner">
                        <div>
                            <img
                                src="@/assets/image.png"
                                alt="ALIR Smart System"
                                class="hero__logo"
                            />
                        </div>

                        <div class="hero__copy">
                            <h1 class="hero__title">{{ asideTitle }}</h1>
                            <p class="hero__desc">{{ asideDescription }}</p>
                        </div>

                        <ul class="hero__features">
                            <li
                                v-for="(feature, i) in features"
                                :key="feature.title"
                                class="hero__feature"
                                :style="{ animationDelay: `${i * 80}ms` }"
                            >
                                <span class="hero__feature-dot"></span>
                                <span class="hero__feature-label">{{
                                    feature.title
                                }}</span>
                            </li>
                        </ul>

                        <div class="hero__badge">
                            <ShieldCheck :size="14" :stroke-width="2" />
                            <span
                                >SOC 2 ready · Role-based access · Audit
                                trail</span
                            >
                        </div>
                    </div>
                </section>

                <!-- Right: Form -->
                <section class="form-panel">
                    <div class="form-panel__inner">
                        <header class="form-panel__header">
                            <img
                                src="@/assets/image.png"
                                alt="ALIR"
                                class="form-panel__logo-mobile"
                            />
                            <h2 class="form-panel__title">{{ formTitle }}</h2>
                            <p v-if="formSubtitle" class="form-panel__subtitle">
                                {{ formSubtitle }}
                            </p>
                        </header>
                        <div class="form-panel__body">
                            <slot />
                        </div>
                    </div>
                </section>
            </div>

            <p class="auth-page__footer">
                © {{ new Date().getFullYear() }} ALIR Smart System · All rights
                reserved
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";
import { ShieldCheck } from "lucide-vue-next";

const props = defineProps<{
    formTitle: string;
    formSubtitle?: string;
    asideTitle?: string;
    asideDescription?: string;
}>();

const features = [
    { title: "Governed onboarding" },
    { title: "Adaptive insights" },
    { title: "Identity-resilient" },
    { title: "Modular orchestration" },
];

const asideTitle = computed(
    () => props.asideTitle ?? "Command center operasional industri 4.0",
);
const asideDescription = computed(
    () =>
        props.asideDescription ??
        "Dashboard, workflows, dan security layer tersusun agar tim Anda bisa mendesain proses secara presisi.",
);

const { formTitle, formSubtitle } = toRefs(props);
</script>

<style scoped>
/* ═══════════════════════════════════════
   PAGE
   ═══════════════════════════════════════ */
.auth-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 40%, #f0fdfa 100%);
    overflow: hidden;
    padding: 1.25rem;
}

/* Dot grid */
.auth-page__grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
        rgba(37, 99, 235, 0.045) 1px,
        transparent 1px
    );
    background-size: 24px 24px;
    pointer-events: none;
}

/* Ambient glow behind card */
.auth-page__glow {
    position: absolute;
    width: 600px;
    height: 600px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
        circle,
        rgba(37, 99, 235, 0.08) 0%,
        rgba(20, 184, 166, 0.05) 40%,
        transparent 70%
    );
    pointer-events: none;
    animation: pulse-glow 6s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
    0% {
        opacity: 0.6;
        transform: translate(-50%, -50%) scale(1);
    }
    100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.15);
    }
}

.auth-page__container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 960px;
}

.auth-page__footer {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.6875rem;
    color: #94a3b8;
    letter-spacing: 0.02em;
}

/* ═══════════════════════════════════════
   CARD
   ═══════════════════════════════════════ */
.auth-card {
    display: grid;
    grid-template-columns: 1fr;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    background: #fff;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.04),
        0 16px 40px -8px rgba(0, 0, 0, 0.08);
}

@media (min-width: 1024px) {
    .auth-card {
        grid-template-columns: 1.1fr 0.9fr;
    }
}

/* ═══════════════════════════════════════
   HERO (LEFT)
   ═══════════════════════════════════════ */
.hero {
    display: none;
    position: relative;
    overflow: hidden;
    background: linear-gradient(
        155deg,
        #0f1b3d 0%,
        #152358 30%,
        #1a3a7a 55%,
        #145c6e 100%
    );
}

@media (min-width: 1024px) {
    .hero {
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

/* Slow-moving shimmer */
.hero__shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        120deg,
        transparent 30%,
        rgba(37, 99, 235, 0.08) 50%,
        transparent 70%
    );
    background-size: 200% 100%;
    animation: shimmer 8s ease-in-out infinite;
    pointer-events: none;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.hero__inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2.75rem 2.5rem;
    max-width: 400px;
}

.hero__logo {
    height: 34px;
    width: auto;
    filter: brightness(0) invert(1);
    opacity: 0.88;
}

.hero__copy {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.hero__title {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.25;
    color: #fff;
    letter-spacing: -0.025em;
}

.hero__desc {
    font-size: 0.8125rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.5);
}

/* Feature pills */
.hero__features {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
}

.hero__feature {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.6);
    animation: fade-up 0.4s ease-out both;
}

.hero__feature-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #14b8a6;
    box-shadow: 0 0 6px rgba(20, 184, 166, 0.5);
}

.hero__feature-label {
    font-weight: 500;
}

@keyframes fade-up {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Trust badge */
.hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: auto;
    padding: 0.625rem 0.875rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.01em;
}

.hero__badge svg {
    color: #14b8a6;
    flex-shrink: 0;
}

/* ═══════════════════════════════════════
   FORM PANEL (RIGHT)
   ═══════════════════════════════════════ */
.form-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1.5rem;
    background: #fff;
}

@media (min-width: 640px) {
    .form-panel {
        padding: 3rem 2.5rem;
    }
}

.form-panel__inner {
    width: 100%;
    max-width: 380px;
}

.form-panel__header {
    margin-bottom: 1.75rem;
}

.form-panel__logo-mobile {
    height: 28px;
    width: auto;
    margin-bottom: 1.25rem;
}

@media (min-width: 1024px) {
    .form-panel__logo-mobile {
        display: none;
    }
}

.form-panel__title {
    font-size: 1.375rem;
    font-weight: 700;
    line-height: 1.3;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.form-panel__subtitle {
    margin-top: 0.375rem;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: #94a3b8;
}

.form-panel__body {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
}
</style>
