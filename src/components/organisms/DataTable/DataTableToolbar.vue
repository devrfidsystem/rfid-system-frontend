<template>
    <div
        class="flex flex-wrap items-center justify-between gap-4 rounded-t-md border-b border-border bg-surface px-4 py-3"
    >
        <div class="flex flex-1 min-w-[240px] items-center gap-3">
            <div
                v-if="showSearch !== false"
                class="flex h-[var(--control-h-md)] w-full max-w-sm items-center gap-2 rounded-md border border-border bg-surface px-3 transition-colors duration-150 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20"
            >
                <label :for="searchId" class="sr-only">Search</label>
                <slot name="search-icon">
                    <Icon
                        :icon="Search"
                        :size="16"
                        class-name="text-text-secondary"
                    />
                </slot>
                <input
                    :id="searchId"
                    v-model="search"
                    class="w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
                    placeholder="Search..."
                    v-bind="
                        bindObjectId(
                            objectId
                                ? `txt_${objectId.replace(/^[^_]+_/, '')}Search`
                                : undefined,
                        )
                    "
                />
            </div>
            <slot name="filters" />
        </div>
        <div class="flex items-center gap-3">
            <slot name="actions" :rows="rows" :visible-rows="visibleRows" />
            <div
                v-if="pageSizeOptions?.length"
                class="flex items-center gap-2 border-l border-border pl-3 text-xs text-text-secondary"
            >
                <label
                    :for="pageSizeId"
                    class="text-xs font-medium uppercase tracking-wide text-text-secondary"
                >
                    Rows
                </label>
                <select
                    :id="pageSizeId"
                    v-model.number="localPageSize"
                    class="h-[var(--control-h-sm)] cursor-pointer rounded-md border border-border bg-surface px-2 text-xs text-text transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    v-bind="
                        bindObjectId(
                            objectId
                                ? `cmb_${objectId.replace(/^[^_]+_/, '')}PageSize`
                                : undefined,
                        )
                    "
                >
                    <option
                        v-for="option in pageSizeOptions"
                        :key="option"
                        :value="option"
                    >
                        {{ option }}
                    </option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Icon from "@/components/atoms/Icon.vue";
import { Search } from "lucide-vue-next";
import { bindObjectId } from "@/utils/objectId";

const props = defineProps<{
    modelValue?: string;
    pageSize: number;
    pageSizeOptions?: number[];
    rows: unknown[];
    visibleRows: unknown[];
    objectId?: string;
    showSearch?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "update:pageSize", value: number): void;
}>();

const search = ref(props.modelValue ?? "");
const localPageSize = ref(props.pageSize ?? props.pageSizeOptions?.[0] ?? 10);
const searchId = `dt-search-${Math.random().toString(36).slice(2, 9)}`;
const pageSizeId = `dt-page-size-${Math.random().toString(36).slice(2, 9)}`;

watch(search, (value) => emit("update:modelValue", value));
watch(
    () => props.modelValue,
    (value) => {
        if (value !== search.value) search.value = value ?? "";
    },
);

watch(localPageSize, (value) => emit("update:pageSize", value));
watch(
    () => props.pageSize,
    (value) => {
        if (value !== localPageSize.value) localPageSize.value = value;
    },
);
</script>
