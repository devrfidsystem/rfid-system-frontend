<template>
    <div class="app-loading-screen">
        <img
            src="@/assets/image.png"
            alt="ALIR Smart System"
            class="app-loading-screen__logo"
        />
        <div class="app-loading-screen__badge">
            <svg
                class="app-loading-screen__icon app-loading-screen__icon--1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M4 11a8 8 0 0 1 16 0"></path>
                <path d="M7.5 11a4.5 4.5 0 0 1 9 0"></path>
                <circle cx="12" cy="17" r="2" fill="#FFFFFF" stroke="none"></circle>
            </svg>
            <svg
                class="app-loading-screen__icon app-loading-screen__icon--2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M21 8v13H3V8"></path>
                <path d="M1 3h22v5H1z"></path>
                <path d="M10 12h4"></path>
            </svg>
            <svg
                class="app-loading-screen__icon app-loading-screen__icon--3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z"></path>
                <circle cx="12" cy="10" r="2.4"></circle>
            </svg>
            <svg
                class="app-loading-screen__icon app-loading-screen__icon--4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M3 3v18h18"></path>
                <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-loading-screen {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    background: #ffffff;
    z-index: 9999;
}

.app-loading-screen__logo {
    height: 40px;
}

.app-loading-screen__badge {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg, 16px);
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #14b8a6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.app-loading-screen__icon {
    position: absolute;
    width: 28px;
    height: 28px;
    opacity: 0;
    transform: scale(0.85);
    animation: app-loading-icon-cycle 3.2s ease-in-out infinite;
}

.app-loading-screen__icon--1 {
    animation-delay: 0s;
}

.app-loading-screen__icon--2 {
    animation-delay: 0.8s;
}

.app-loading-screen__icon--3 {
    animation-delay: 1.6s;
}

.app-loading-screen__icon--4 {
    animation-delay: 2.4s;
}

@keyframes app-loading-icon-cycle {
    0%,
    15% {
        opacity: 1;
        transform: scale(1);
    }
    20%,
    100% {
        opacity: 0;
        transform: scale(0.85);
    }
}
</style>
