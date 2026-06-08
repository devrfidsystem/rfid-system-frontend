<template>
    <div
        class="fixed right-6 top-6 z-[60] w-[360px] max-w-[calc(100vw-3rem)] space-y-3"
    >
        <div
            v-for="toast in toasts"
            :id="`msb_Toast_${toast.id}`"
            :key="toast.id"
            class="group relative overflow-hidden rounded-md border bg-white shadow-lg"
            :class="variantClass(toast.variant)"
            role="status"
            aria-live="polite"
            :data-testid="`msb_Toast_${toast.id}`"
            @mouseenter="$emit('pause', toast.id)"
            @mouseleave="$emit('resume', toast.id)"
        >
            <div class="flex items-start gap-3 px-4 py-4">
                <div class="mt-0.5 shrink-0">
                    <Icon
                        :icon="variantIcon(toast.variant)"
                        :size="20"
                        :class-name="variantIconClass(toast.variant)"
                    />
                </div>

                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 leading-snug">
                        {{ toast.message }}
                    </p>
                </div>

                <button
                    :id="`icn_ToastClose_${toast.id}`"
                    type="button"
                    class="rounded-md p-1 text-gray-400 opacity-0 transition hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label="Dismiss"
                    :data-testid="`icn_ToastClose_${toast.id}`"
                    @click="$emit('close', toast.id)"
                >
                    ✕
                </button>
            </div>

            <div
                class="h-1 w-full"
                :class="variantBarClass(toast.variant)"
            ></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Icon from "@/components/atoms/Icon.vue";
import type { ToastVariant } from "@/store/notification.store";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-vue-next";

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
            return "border-emerald-100 bg-emerald-50/30";
        case "error":
            return "border-red-100 bg-red-50/30";
        case "warning":
            return "border-amber-100 bg-amber-50/30";
        case "info":
            return "border-blue-100 bg-blue-50/30";
        default:
            return "border-border-default";
    }
};

const variantBarClass = (v: ToastVariant) => {
    switch (v) {
        case "success":
            return "bg-emerald-500";
        case "error":
            return "bg-signal-red";
        case "warning":
            return "bg-action-orange";
        case "info":
            return "bg-primary-500";
        default:
            return "bg-border-default";
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

const variantIconClass = (v: ToastVariant) => {
    switch (v) {
        case "success":
            return "text-emerald-500";
        case "error":
            return "text-signal-red";
        case "warning":
            return "text-action-orange";
        case "info":
            return "text-primary-500";
        default:
            return "text-text-secondary";
    }
};
</script>
