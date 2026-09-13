<template>
    <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"
    >
        <div class="flex flex-1 min-w-0 items-center gap-3">
            <div
                v-if="showSearch"
                class="flex w-full items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2"
            >
                <Input
                    :model-value="localKeyword"
                    :placeholder="placeholder"
                    :disabled="disabled || loading"
                    hide-message
                    class="flex-1 border-none bg-transparent px-0 text-sm"
                    data-testid="input-2"
                    @update:model-value="onKeywordUpdate"
                />
                <Button
                    v-if="localKeyword"
                    variant="ghost"
                    size="sm"
                    type="button"
                    data-testid="button-handleclear"
                    @click="handleClear"
                >
                    Clear
                </Button>
            </div>
            <slot name="filters" />
        </div>
        <div class="flex items-center gap-2">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";

const props = defineProps<{
    keyword?: string;
    placeholder?: string;
    showSearch?: boolean;
    loading?: boolean;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:keyword", value: string): void;
    (e: "clear"): void;
}>();

const localKeyword = ref(props.keyword ?? "");
const showSearch = computed(() => props.showSearch ?? true);
const placeholder = computed(() => props.placeholder ?? "Search...");

watch(localKeyword, (value) => emit("update:keyword", value));
watch(
    () => props.keyword,
    (value) => {
        if (value !== localKeyword.value) {
            localKeyword.value = value ?? "";
        }
    },
);

const onKeywordUpdate = (value: string) => {
    localKeyword.value = value;
};

const handleClear = () => {
    if (props.disabled || props.loading) return;
    localKeyword.value = "";
    emit("clear");
};
</script>
