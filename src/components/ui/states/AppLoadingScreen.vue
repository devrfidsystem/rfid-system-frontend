<template>
    <div class="app-loading-screen">
        <img
            src="@/assets/image.png"
            alt="ALIR Smart System"
            class="app-loading-screen__logo"
        />
        <div class="app-loading-screen__wave">
            <span class="app-loading-screen__dot app-loading-screen__dot--1"></span>
            <span class="app-loading-screen__dot app-loading-screen__dot--2"></span>
            <span class="app-loading-screen__dot app-loading-screen__dot--3"></span>
            <span class="app-loading-screen__dot app-loading-screen__dot--4"></span>
            <span class="app-loading-screen__dot app-loading-screen__dot--5"></span>
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
    gap: 24px;
    background: #ffffff;
    z-index: 9999;
}

.app-loading-screen__logo {
    height: 40px;
}

.app-loading-screen__wave {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 24px;
}

.app-loading-screen__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: app-loading-wave 1s ease-in-out infinite;
}

.app-loading-screen__dot--1 {
    background: #1e40af;
    animation-delay: 0s;
}

.app-loading-screen__dot--2 {
    background: #2650cb;
    animation-delay: 0.1s;
}

.app-loading-screen__dot--3 {
    background: #2563eb;
    animation-delay: 0.2s;
}

.app-loading-screen__dot--4 {
    background: #1c95a3;
    animation-delay: 0.3s;
}

.app-loading-screen__dot--5 {
    background: #14b8a6;
    animation-delay: 0.4s;
}

@keyframes app-loading-wave {
    0%,
    60%,
    100% {
        transform: translateY(0);
        opacity: 0.5;
    }
    30% {
        transform: translateY(-10px);
        opacity: 1;
    }
}
</style>
