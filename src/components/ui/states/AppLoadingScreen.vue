<template>
    <div class="app-loading-screen">
        <div class="app-loading-screen__stage">
            <img
                src="@/assets/image.png"
                alt="ALIR Smart System"
                class="app-loading-screen__frame app-loading-screen__frame--1"
            />
            <img
                src="@/assets/warehouse-icons/truck.png"
                alt=""
                class="app-loading-screen__frame app-loading-screen__frame--2"
            />
            <img
                src="@/assets/warehouse-icons/forklift.png"
                alt=""
                class="app-loading-screen__frame app-loading-screen__frame--3"
            />
            <img
                src="@/assets/warehouse-icons/warehouse-row.png"
                alt=""
                class="app-loading-screen__frame app-loading-screen__frame--4"
            />
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

.app-loading-screen__stage {
    position: relative;
    width: 140px;
    height: 140px;
}

.app-loading-screen__frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transform: scale(0.92);
    animation: app-loading-frame-cycle 2.6s ease-in-out infinite;
}

.app-loading-screen__frame--1 {
    animation-delay: 0s;
}

.app-loading-screen__frame--2 {
    animation-delay: 0.65s;
}

.app-loading-screen__frame--3 {
    animation-delay: 1.3s;
}

.app-loading-screen__frame--4 {
    animation-delay: 1.95s;
}

@keyframes app-loading-frame-cycle {
    0% {
        opacity: 0;
        transform: scale(0.92);
    }
    6%,
    19% {
        opacity: 1;
        transform: scale(1);
    }
    25%,
    100% {
        opacity: 0;
        transform: scale(0.92);
    }
}
</style>
