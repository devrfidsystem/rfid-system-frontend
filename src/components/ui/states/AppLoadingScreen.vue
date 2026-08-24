<template>
    <div class="app-loading-screen">
        <img
            src="@/assets/image.png"
            alt="ALIR Smart System"
            class="app-loading-screen__logo"
        />
        <div class="app-loading-screen__stage">
            <img
                src="@/assets/warehouse-icons/truck.png"
                alt=""
                class="app-loading-screen__frame app-loading-screen__frame--1"
            />
            <img
                src="@/assets/warehouse-icons/forklift.png"
                alt=""
                class="app-loading-screen__frame app-loading-screen__frame--2"
            />
            <img
                src="@/assets/warehouse-icons/rack-shelf.png"
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    background: #ffffff;
    z-index: 9999;
}

.app-loading-screen__logo {
    height: 40px;
}

.app-loading-screen__stage {
    position: relative;
    width: 110px;
    height: 110px;
}

.app-loading-screen__frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transform: scale(0.9);
    animation: app-loading-frame-cycle 1s ease-in-out infinite;
}

.app-loading-screen__frame--1 {
    animation-delay: 0s;
}

.app-loading-screen__frame--2 {
    animation-delay: 0.25s;
}

.app-loading-screen__frame--3 {
    animation-delay: 0.5s;
}

.app-loading-screen__frame--4 {
    animation-delay: 0.75s;
}

@keyframes app-loading-frame-cycle {
    0% {
        opacity: 0;
        transform: scale(0.9);
    }
    8%,
    17% {
        opacity: 1;
        transform: scale(1);
    }
    25%,
    100% {
        opacity: 0;
        transform: scale(0.9);
    }
}
</style>
