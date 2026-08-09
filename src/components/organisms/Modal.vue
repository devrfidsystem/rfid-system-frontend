<template>
    <Teleport to="body">
        <transition name="modal-fade">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                :aria-label="title || 'Dialog'"
                @keydown.esc.prevent="close"
            >
                <div class="absolute inset-0 bg-gray-900/50" @click="close" />

                <div
                    ref="panelRef"
                    class="relative w-full max-w-lg rounded-md border border-border bg-surface shadow-sm"
                    tabindex="-1"
                    v-bind="bindObjectId(objectId)"
                >
                    <header
                        class="flex items-center justify-between border-b border-border px-6 py-4"
                    >
                        <div class="min-w-0">
                            <h3
                                class="truncate text-lg font-semibold text-text"
                            >
                                {{ title }}
                            </h3>
                        </div>

                        <button
                            type="button"
                            class="rounded-full border border-border bg-surface px-2 py-1 text-sm text-text-secondary transition-colors duration-150 hover:bg-surface-secondary hover:text-text focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            aria-label="Close dialog"
                            v-bind="
                                bindObjectId(
                                    objectId
                                        ? `icn_${objectId.replace(/^[^_]+_/, '')}Close`
                                        : undefined,
                                )
                            "
                            @click="close"
                        >
                            <Icon
                                :icon="X"
                                :size="14"
                                class-name="text-current"
                            />
                        </button>
                    </header>

                    <div class="px-6 py-5">
                        <slot />
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
import { bindObjectId } from "@/utils/objectId";
import Icon from "@/components/atoms/Icon.vue";
import { X } from "lucide-vue-next";

const props = defineProps<{
    isOpen: boolean;
    title?: string;
    objectId?: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
}>();

const panelRef = ref<HTMLElement | null>(null);
let lastActiveElement: HTMLElement | null = null;

const close = () => emit("close");

const lockBody = (locked: boolean) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = locked ? "hidden" : "";
};

watch(
    () => props.isOpen,
    async (open) => {
        lockBody(open);

        if (open) {
            lastActiveElement =
                typeof document === "undefined"
                    ? null
                    : (document.activeElement as HTMLElement | null);
            await nextTick();
            panelRef.value?.focus();
        } else {
            // restore focus to previous element for better UX
            lastActiveElement?.focus?.();
            lastActiveElement = null;
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    lockBody(false);
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-active .max-w-lg,
.modal-fade-leave-active .max-w-lg {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-from .max-w-lg,
.modal-fade-leave-to .max-w-lg {
    transform: scale(0.95) translateY(10px);
}
</style>
