<template>
    <div
        id="msb_ToastContainer"
        aria-live="polite"
        aria-atomic="true"
        data-testid="msb_ToastContainer"
    >
        <Toast
            :toasts="store.toasts"
            @close="store.removeToast"
            @pause="store.pause"
            @resume="store.resume"
        />
    </div>
</template>

<script setup lang="ts">
import Toast from "./Toast.vue";
import { useNotificationStore } from "@/store/notification.store";

const store = useNotificationStore();
</script>
