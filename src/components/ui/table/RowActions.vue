<template>
    <div ref="rootRef" class="relative inline-flex">
        <Button
            variant="ghost"
            size="sm"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="isOpen"
            class="text-base"
            :disabled="disabled"
            @click="toggleMenu"
        >
            ⋮
        </Button>
        <div
            v-if="isOpen"
            ref="menuRef"
            :class="[
                'absolute z-50 mt-2 w-40 space-y-1 rounded-md border border-gray-200 bg-white p-1 shadow-lg',
                alignClass,
            ]"
            role="menu"
        >
            <button
                v-for="action in actions"
                :key="action.key"
                type="button"
                class="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-gray-50"
                :class="[
                    action.danger ? 'text-error-600' : 'text-gray-700',
                    action.disabled ? 'opacity-50 pointer-events-none' : '',
                ]"
                role="menuitem"
                @click="execute(action)"
            >
                {{ action.label }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Button from "@/components/atoms/Button.vue";

type Action = {
    key: string;
    label: string;
    danger?: boolean;
    disabled?: boolean;
    onClick: () => void;
};

const props = defineProps<{
    actions: Action[];
    disabled?: boolean;
    align?: "left" | "right";
}>();

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);

const alignClass = computed(() =>
    props.align === "left" ? "left-0" : "right-0",
);

const toggleMenu = () => {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
};

const closeMenu = () => {
    isOpen.value = false;
};

const handleClickOutside = (event: Event) => {
    const target = event.target as Node | null;
    if (
        isOpen.value &&
        rootRef.value &&
        !rootRef.value.contains(target) &&
        menuRef.value &&
        !menuRef.value.contains(target)
    ) {
        closeMenu();
    }
};

const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        closeMenu();
    }
};

onMounted(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
});

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleEsc);
});

const execute = (action: Action) => {
    if (action.disabled) return;
    action.onClick();
    closeMenu();
};
</script>
