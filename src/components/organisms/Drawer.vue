<template>
    <Teleport to="body">
        <transition name="drawer-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-50"
                @mousedown.self="handleBackdropClick"
            >
                <div
                    class="absolute inset-0 bg-gray-900/50"
                    aria-hidden="true"
                ></div>

                <dialog
                    ref="drawerRef"
                    open
                    aria-modal="true"
                    :aria-labelledby="titleId"
                    :aria-describedby="descriptionId"
                    class="absolute inset-0 m-0 flex h-full w-full max-h-none max-w-none items-stretch border-0 bg-transparent p-0"
                    :class="
                        props.side === 'left' ? 'justify-start' : 'justify-end'
                    "
                >
                    <aside
                        class="relative flex h-full max-h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-md border border-border bg-surface shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
                        :class="[widthClass, sideClass]"
                        tabindex="-1"
                        v-bind="bindObjectId(objectId)"
                        @keydown.esc.prevent="handleEsc"
                        @click.stop
                    >
                        <header
                            class="flex items-center justify-between px-4 py-3"
                        >
                            <div class="space-y-1">
                                <p
                                    v-if="title"
                                    :id="titleId"
                                    class="text-lg font-semibold text-text"
                                >
                                    {{ title }}
                                </p>
                                <p
                                    v-if="description"
                                    :id="descriptionId"
                                    class="text-sm text-text-secondary"
                                >
                                    {{ description }}
                                </p>
                            </div>
                            <button
                                v-if="!hideClose"
                                type="button"
                                class="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text focus:outline-none focus:ring-2 focus:ring-primary-200"
                                aria-label="Close drawer"
                                v-bind="
                                    bindObjectId(
                                        objectId
                                            ? `icn_${objectId.replace(/^[^_]+_/, '')}Close`
                                            : undefined,
                                    )
                                "
                                @click="close"
                            >
                                <span
                                    aria-hidden="true"
                                    class="text-xl leading-none"
                                    >×</span
                                >
                            </button>
                        </header>

                        <section class="flex-1 overflow-y-auto px-6 py-5">
                            <slot />
                        </section>

                        <footer
                            v-if="$slots.footer"
                            class="border-t border-border bg-surface px-6 py-4"
                        >
                            <slot name="footer" />
                        </footer>
                    </aside>
                </dialog>
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
    side?: "right" | "left";
    width?: "xs" | "sm" | "md" | "lg";
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    persistent?: boolean;
    hideClose?: boolean;
    objectId?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "open"): void;
    (e: "close"): void;
}>();

const isOpen = computed(() => props.modelValue);
const drawerRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
const id = useId();
const titleId = computed(() =>
    props.title ? `${id}-drawer-title` : undefined,
);
const descriptionId = computed(() =>
    props.description ? `${id}-drawer-description` : undefined,
);

const widthClass = computed(() => {
    switch (props.width) {
        case "xs":
            return "max-w-xs w-full";
        case "sm":
            return "max-w-sm w-full";
        case "lg":
            return "max-w-3xl w-full";
        default:
            return "max-w-xl w-full";
    }
});

const sideClass = computed(() =>
    props.side === "left"
        ? "m-2 mr-auto h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] translate-x-0"
        : "m-2 ml-auto h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] translate-x-0",
);

const lockScroll = () => {
    document.body.style.overflow = "hidden";
};
const unlockScroll = () => {
    document.body.style.overflow = "";
};

const focusPanel = () => {
    nextTick(() => {
        if (drawerRef.value) {
            const focusable = drawerRef.value.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            (focusable ?? drawerRef.value).focus();
        }
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
            focusPanel();
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
        focusPanel();
    }
});

onBeforeUnmount(() => {
    unlockScroll();
});
</script>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-fade-enter-active > div > dialog > aside,
.drawer-fade-leave-active > div > dialog > aside {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
    opacity: 0;
}

.drawer-fade-enter-from > div > dialog > aside.ml-auto,
.drawer-fade-leave-to > div > dialog > aside.ml-auto {
    transform: translateX(100%);
}

.drawer-fade-enter-from > div > dialog > aside.mr-auto,
.drawer-fade-leave-to > div > dialog > aside.mr-auto {
    transform: translateX(-100%);
}
</style>
