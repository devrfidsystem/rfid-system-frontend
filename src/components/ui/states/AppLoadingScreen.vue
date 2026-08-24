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
    overflow: hidden;
}

.app-loading-screen__frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: translateX(100%);
    animation: app-loading-frame-swipe 2.6s cubic-bezier(0.65, 0, 0.35, 1)
        infinite;
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

@keyframes app-loading-frame-swipe {
    0% {
        transform: translateX(100%);
    }
    8% {
        transform: translateX(0%);
    }
    17% {
        transform: translateX(0%);
    }
    25%,
    100% {
        transform: translateX(-100%);
    }
}
</style>
