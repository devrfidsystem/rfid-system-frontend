<template>
    <div class="app-loading-screen">
        <img
            src="@/assets/image.png"
            alt="ALIR Smart System"
            class="app-loading-screen__logo"
        />
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-loading-screen {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    z-index: 9999;
}

.app-loading-screen__logo {
    height: 64px;
    animation: app-loading-pulse 1.4s ease-in-out infinite;
}

@keyframes app-loading-pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.6;
        transform: scale(0.92);
    }
}
</style>
