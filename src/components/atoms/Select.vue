<template>
    <label class="flex flex-col gap-1.5 text-sm" :for="id">
        <span
            v-if="label"
            :class="labelClass ?? 'font-medium text-text-secondary'"
        >
            {{ label }}
        </span>

        <div ref="rootRef" class="relative">
            <button
                :id="id"
                type="button"
                :disabled="disabled"
                :aria-invalid="hasVisualError || undefined"
                aria-haspopup="listbox"
                :aria-expanded="opened"
                class="flex h-[var(--control-h-md)] w-full items-center justify-between gap-3 rounded-md border bg-surface px-3 text-left text-sm transition-colors duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary"
                :class="[selectClasses, $slots.icon ? 'pl-10' : '']"
                v-bind="{ ...attrs, ...bindObjectId(objectId) }"
                @click="toggle"
                @keydown="handleKeydown"
            >
                <span
                    class="min-w-0 flex-1 truncate"
                    :class="
                        hasSelection
                            ? 'text-text font-medium'
                            : 'text-text-muted'
                    "
                >
                    {{ displayLabel }}
                </span>

                <span class="flex items-center gap-2">
                    <slot name="icon" />
                    <ChevronDown
                        class="h-4 w-4 shrink-0 text-text-secondary transition-transform duration-150"
                        :class="opened ? 'rotate-180' : ''"
                        :stroke-width="1.75"
                    />
                </span>
            </button>

            <transition
                enter-active-class="transition duration-150 ease-out"
                leave-active-class="transition duration-150 ease-in"
                enter-from-class="opacity-0 translate-y-1"
                leave-to-class="opacity-0 translate-y-1"
            >
                <div
                    v-if="opened"
                    class="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-sm"
                >
                    <div v-if="searchable" class="border-b border-border p-2">
                        <input
                            v-model="searchTerm"
                            type="search"
                            class="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                            :placeholder="searchPlaceholder ?? 'Search...'"
                            @click.stop
                            @keydown.stop
                        />
                    </div>
                    <ul
                        ref="listRef"
                        role="listbox"
                        :aria-activedescendant="
                            activeIndex >= 0 ? optionId(activeIndex) : undefined
                        "
                        class="max-h-60 overflow-auto p-1"
                    >
                        <li
                            v-for="(option, index) in filteredOptions"
                            :id="optionId(index)"
                            :key="String(option.value)"
                            role="option"
                            :aria-selected="String(option.value) === modelValue"
                        >
                            <button
                                type="button"
                                class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"
                                :class="
                                    String(option.value) === modelValue
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text'
                                "
                                @click="selectOption(option)"
                                @mouseenter="activeIndex = index"
                            >
                                <span class="min-w-0 truncate">
                                    {{ option.label }}
                                </span>
                                <Check
                                    v-if="String(option.value) === modelValue"
                                    class="h-4 w-4 shrink-0 text-primary-600"
                                    :stroke-width="2"
                                />
                            </button>
                        </li>
                        <li
                            v-if="filteredOptions.length === 0"
                            class="px-3 py-2 text-sm text-text-secondary"
                        >
                            No options found.
                        </li>
                    </ul>
                </div>
            </transition>
        </div>

        <p
            v-if="hint && !error && !hideMessage"
            class="text-xs text-text-secondary"
        >
            {{ hint }}
        </p>
        <p v-if="error && !hideMessage" class="text-xs text-danger-600">
            {{ error }}
        </p>
    </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useAttrs,
    watch,
} from "vue";
import { Check, ChevronDown } from "lucide-vue-next";
import { bindObjectId } from "@/utils/objectId";

const props = defineProps<{
    label?: string;
    labelClass?: string;
    id?: string;
    modelValue?: string;
    options: { label: string; value: string | number }[];
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    invalid?: boolean;
    hideMessage?: boolean;
    placeholderDisabled?: boolean;
    objectId?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
}>();

const attrs = useAttrs();
const placeholderDisabled = computed(() => props.placeholderDisabled ?? true);
const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "search", value: string): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const opened = ref(false);
const activeIndex = ref(-1);
const searchTerm = ref("");

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const baseClasses =
    "border-border text-text focus:border-primary-500 focus:ring-primary-500/20";
const errorClasses =
    "border-danger-500 bg-danger-50 text-danger-700 focus:border-danger-500 focus:ring-danger-500/20";
const selectClasses = computed(() =>
    hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses,
);

const currentValue = computed(() => props.modelValue ?? "");
const currentOption = computed(() =>
    props.options.find((option) => String(option.value) === currentValue.value),
);
const hasSelection = computed(() => Boolean(currentOption.value));
const displayLabel = computed(
    () => currentOption.value?.label ?? props.placeholder ?? "Select an option",
);
const filteredOptions = computed(() => {
    if (!props.searchable) return props.options;
    const query = searchTerm.value.trim().toLowerCase();
    if (!query) return props.options;
    return props.options.filter((option) =>
        option.label.toLowerCase().includes(query),
    );
});

const optionId = (index: number) => `${props.id ?? "select"}-option-${index}`;

const close = () => {
    opened.value = false;
    activeIndex.value = -1;
};

const open = () => {
    if (props.disabled) return;
    opened.value = true;
    activeIndex.value = Math.max(
        0,
        filteredOptions.value.findIndex(
            (option) => String(option.value) === currentValue.value,
        ),
    );
};

const toggle = () => {
    if (opened.value) {
        close();
        return;
    }
    open();
};

const selectOption = (option: { label: string; value: string | number }) => {
    emit("update:modelValue", String(option.value));
    close();
};

const moveActive = (step: number) => {
    if (!filteredOptions.value.length) return;
    const nextIndex =
        activeIndex.value < 0
            ? 0
            : (activeIndex.value + step + filteredOptions.value.length) %
              filteredOptions.value.length;
    activeIndex.value = nextIndex;
    const optionEl = document.getElementById(optionId(nextIndex));
    optionEl?.scrollIntoView({ block: "nearest" });
};

const handleKeydown = (event: KeyboardEvent) => {
    if (props.disabled) return;

    if (!opened.value && ["Enter", " ", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        open();
        return;
    }

    if (!opened.value) return;

    switch (event.key) {
        case "Escape":
            event.preventDefault();
            close();
            break;
        case "ArrowDown":
            event.preventDefault();
            moveActive(1);
            break;
        case "ArrowUp":
            event.preventDefault();
            moveActive(-1);
            break;
        case "Enter":
        case " ":
            event.preventDefault();
            if (activeIndex.value >= 0) {
                selectOption(filteredOptions.value[activeIndex.value]);
            }
            break;
    }
};

const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as Node | null;
    if (!target || !rootRef.value) return;
    if (!rootRef.value.contains(target)) {
        close();
    }
};

watch(
    () => props.modelValue,
    (value) => {
        if (!opened.value) return;
        activeIndex.value = filteredOptions.value.findIndex(
            (option) => String(option.value) === (value ?? ""),
        );
    },
);

watch(searchTerm, (value) => {
    emit("search", value);
    activeIndex.value = filteredOptions.value.length ? 0 : -1;
});

onMounted(() => {
    document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleDocumentClick);
});
</script>
