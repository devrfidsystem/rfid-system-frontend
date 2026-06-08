<template>
    <Teleport to="body">
        <transition name="dialog-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-50"
                @mousedown.self="handleBackdropClick"
            >
                <div
                    class="fixed inset-0 z-0 bg-gray-900/50 backdrop-blur-sm"
                    aria-hidden="true"
                ></div>

                <div
                    ref="dialogRef"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="titleId"
                    :aria-describedby="descriptionId"
                    class="relative z-10 flex min-h-full items-center justify-center px-4"
                >
                    <div
                        class="relative w-full overflow-hidden rounded-md bg-white shadow-xl border border-gray-200 focus:outline-none"
                        :class="sizeClass"
                        tabindex="-1"
                        v-bind="bindObjectId(objectId)"
                        @keydown.esc.prevent="handleEsc"
                        @click.stop
                    >
                        <header
                            class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4"
                        >
                            <div class="space-y-1">
                                <slot name="title">
                                    <p
                                        v-if="title"
                                        :id="titleId"
                                        class="text-lg font-semibold text-gray-900"
                                    >
                                        {{ title }}
                                    </p>
                                </slot>
                                <slot name="description">
                                    <p
                                        v-if="description"
                                        :id="descriptionId"
                                        class="text-sm text-text-secondary"
                                    >
                                        {{ description }}
                                    </p>
                                </slot>
                            </div>
                            <div v-if="!hideClose" class="flex items-center">
                                <slot name="header">
                                    <button
                                        ref="closeButtonRef"
                                        type="button"
                                        class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-md text-sm w-8 h-8 inline-flex justify-center items-center focus:outline-none focus:ring-4 focus:ring-gray-200"
                                        aria-label="Close"
                                        v-bind="
                                            bindObjectId(
                                                objectId
                                                    ? `icn_${objectId.replace(/^[^_]+_/, '')}Close`
                                                    : undefined,
                                            )
                                        "
                                        @click="close"
                                    >
                                        <svg
                                            class="w-3 h-3"
                                            aria-hidden="true"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 14 14"
                                        >
                                            <path
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                            />
                                        </svg>
                                    </button>
                                </slot>
                            </div>
                        </header>

                        <section class="px-6 py-5">
                            <slot />
                        </section>

                        <footer
                            v-if="$slots.footer"
                            class="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-md"
                        >
                            <slot name="footer" />
                        </footer>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    watch,
} from "vue";
import { bindObjectId } from "@/utils/objectId";

const props = defineProps<{
    modelValue: boolean;
    title?: string;
    description?: string;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    size?: "sm" | "md" | "lg";
    hideClose?: boolean;
    persistent?: boolean;
    initialFocus?: "close" | "content";
    objectId?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "open"): void;
    (e: "close"): void;
}>();

const isOpen = computed(() => props.modelValue);
const dialogRef = ref<HTMLElement | null>(null);
const closeButtonRef = ref<HTMLButtonElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
const id = useId();
const titleId = computed(() => (props.title ? `${id}-title` : undefined));
const descriptionId = computed(() =>
    props.description ? `${id}-description` : undefined,
);

const sizeClass = computed(() => {
    switch (props.size) {
        case "sm":
            return "max-w-md";
        case "lg":
            return "max-w-3xl";
        default:
            return "max-w-2xl";
    }
});

const lockScroll = () => {
    document.body.style.overflow = "hidden";
};
const unlockScroll = () => {
    document.body.style.overflow = "";
};

const focusContent = () => {
    nextTick(() => {
        if (props.initialFocus === "close" && closeButtonRef.value) {
            closeButtonRef.value.focus();
            return;
        }
        const dialog = dialogRef.value;
        if (!dialog) return;
        const focusable = dialog.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable) {
            focusable.focus();
            return;
        }
        dialog.focus();
    });
};

const close = () => {
    if (props.persistent) return;
    emit("update:modelValue", false);
    emit("close");
};

const handleBackdropClick = () => {
    if (props.closeOnBackdrop ?? true) {
        close();
    }
};

const handleEsc = () => {
    if (props.closeOnEsc ?? true) {
        close();
    }
};

watch(
    isOpen,
    (open) => {
        if (open) {
            previousActiveElement.value =
                document.activeElement as HTMLElement | null;
            lockScroll();
            emit("open");
            focusContent();
        } else {
            unlockScroll();
            if (
                previousActiveElement.value &&
                document.body.contains(previousActiveElement.value)
            ) {
                previousActiveElement.value.focus();
            }
        }
    },
    { immediate: true },
);

onMounted(() => {
    if (props.modelValue) {
        previousActiveElement.value =
            document.activeElement as HTMLElement | null;
        lockScroll();
        focusContent();
    }
});

onBeforeUnmount(() => {
    unlockScroll();
});
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-fade-enter-active .backdrop-blur-sm,
.dialog-fade-leave-active .backdrop-blur-sm {
    transition: backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-fade-enter-active .rounded-md,
.dialog-fade-leave-active .rounded-md {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;
}

.dialog-fade-enter-from .backdrop-blur-sm,
.dialog-fade-leave-to .backdrop-blur-sm {
    backdrop-filter: blur(0px);
}

.dialog-fade-enter-from .rounded-md,
.dialog-fade-leave-to .rounded-md {
    transform: scale(0.95) translateY(10px);
}
</style>
