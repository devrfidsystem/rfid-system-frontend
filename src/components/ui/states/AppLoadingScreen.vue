<template>
    <div class="app-loading-screen">
        <div class="app-loading-screen__mark">
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M4 11a8 8 0 0 1 16 0"></path>
                <path d="M7.5 11a4.5 4.5 0 0 1 9 0"></path>
                <circle
                    cx="12"
                    cy="17"
                    r="2"
                    fill="#FFFFFF"
                    stroke="none"
                ></circle>
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
    align-items: center;
    justify-content: center;
    background: #ffffff;
    z-index: 9999;
}

.app-loading-screen__mark {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg, 16px);
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #14b8a6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
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
