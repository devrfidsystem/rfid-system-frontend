<template>
    <div
        class="fixed right-6 top-6 z-[60] w-[360px] max-w-[calc(100vw-3rem)] space-y-3"
    >
        <div
            v-for="toast in toasts"
            :id="`msb_Toast_${toast.id}`"
            :key="toast.id"
            class="group relative overflow-hidden rounded-md shadow-sm"
            :class="variantClass(toast.variant)"
            role="status"
            aria-live="polite"
            :data-testid="`msb_Toast_${toast.id}`"
            @mouseenter="$emit('pause', toast.id)"
            @mouseleave="$emit('resume', toast.id)"
        >
            <div class="flex items-start gap-3 px-4 py-3">
                <div class="mt-0.5 shrink-0">
                    <Icon
                        :icon="variantIcon(toast.variant)"
                        :size="20"
                        class-name="text-white"
                    />
                </div>

                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-white leading-snug">
                        {{ toast.message }}
                    </p>
                </div>

                <button
                    :id="`icn_ToastClose_${toast.id}`"
                    type="button"
                    class="rounded-md p-1 text-white/80 opacity-0 transition-colors duration-150 hover:bg-white/15 hover:text-white group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    aria-label="Dismiss"
                    :data-testid="`icn_ToastClose_${toast.id}`"
                    @click="$emit('close', toast.id)"
                >
                    <Icon :icon="X" :size="14" class-name="text-current" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Icon from "@/components/atoms/Icon.vue";
import type { ToastVariant } from "@/store/notification.store";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-vue-next";

type ToastItem = {
    id: string;
    message: string;
    variant: ToastVariant;
    duration: number;
};

defineProps<{
    toasts: ToastItem[];
}>();

defineEmits<{
    (e: "close", id: string): void;
    (e: "pause", id: string): void;
    (e: "resume", id: string): void;
}>();

const variantClass = (v: ToastVariant) => {
    switch (v) {
        case "success":
            return "bg-success-600";
        case "error":
            return "bg-danger-600";
        case "warning":
            return "bg-warning-600";
        case "info":
            return "bg-primary-600";
        default:
            return "bg-text-secondary";
    }
};

const variantIcon = (v: ToastVariant) => {
    switch (v) {
        case "success":
            return CheckCircle2;
        case "error":
            return XCircle;
        case "warning":
            return AlertTriangle;
        case "info":
            return Info;
        default:
            return Info;
    }
};
</script>
