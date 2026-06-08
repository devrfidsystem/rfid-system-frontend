<template>
    <transition name="drawer-fade">
        <Teleport to="body">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-50"
                @mousedown.self="handleBackdropClick"
            >
                <div
                    class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                    aria-hidden="true"
                ></div>

                <div
                    ref="drawerRef"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="titleId"
                    :aria-describedby="descriptionId"
                    class="absolute inset-0 flex"
                >
                    <aside
                        class="relative flex h-full flex-col bg-white shadow-2xl border-l border-border-default"
                        :class="[widthClass, sideClass]"
                        tabindex="-1"
                        v-bind="bindObjectId(objectId)"
                        @keydown.esc.prevent="handleEsc"
                        @click.stop
                    >
                        <header
                            class="flex items-center justify-between border-b border-border-default px-6 py-4"
                        >
                            <div class="space-y-1">
                                <p
                                    v-if="title"
                                    :id="titleId"
                                    class="text-lg font-semibold text-gray-900"
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
                                class="rounded-full border border-border-default bg-workspace-bg px-2 py-1 text-sm text-text-secondary transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
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
                                ×
                            </button>
                        </header>

                        <section class="flex-1 overflow-y-auto px-6 py-5">
                            <slot />
                        </section>

                        <footer
                            v-if="$slots.footer"
                            class="border-t border-border-default bg-workspace-bg px-6 py-4"
                        >
                            <slot name="footer" />
                        </footer>
                    </aside>
                </div>
            </div>
        </Teleport>
    </transition>
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
    width?: "sm" | "md" | "lg";
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
        ? "mr-auto h-full translate-x-0 border-r border-l-0"
        : "ml-auto h-full translate-x-0",
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

.drawer-fade-enter-active .backdrop-blur-sm,
.drawer-fade-leave-active .backdrop-blur-sm {
    transition: backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-fade-enter-active > div > aside,
.drawer-fade-leave-active > div > aside {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
    opacity: 0;
}

.drawer-fade-enter-from .backdrop-blur-sm,
.drawer-fade-leave-to .backdrop-blur-sm {
    backdrop-filter: blur(0px);
}

.drawer-fade-enter-from > div > aside.ml-auto,
.drawer-fade-leave-to > div > aside.ml-auto {
    transform: translateX(100%);
}

.drawer-fade-enter-from > div > aside.mr-auto,
.drawer-fade-leave-to > div > aside.mr-auto {
    transform: translateX(-100%);
}
</style>
