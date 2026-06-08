<template>
    <div
        class="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-white rounded-t-md"
    >
        <div class="flex flex-1 min-w-[240px] items-center gap-3">
            <div
                class="flex w-full max-w-sm items-center gap-2 rounded-md bg-workspace-bg border border-border-default px-3 py-2 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-400 transition-all"
            >
                <slot name="search-icon">
                    <Icon
                        :icon="Search"
                        :size="16"
                        class-name="text-text-secondary"
                    />
                </slot>
                <input
                    v-model="search"
                    class="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
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
                class="flex items-center gap-2 text-xs text-text-secondary pl-3 border-l border-border-default"
            >
                <span
                    class="text-xs font-medium uppercase tracking-wider text-gray-500"
                    >Rows</span
                >
                <select
                    v-model.number="localPageSize"
                    class="rounded-md border border-border-default bg-workspace-bg px-2 py-1 text-xs focus:border-primary-400 focus:ring-1 focus:ring-primary-100 cursor-pointer"
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
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "update:pageSize", value: number): void;
}>();

const search = ref(props.modelValue ?? "");
const localPageSize = ref(props.pageSize ?? props.pageSizeOptions?.[0] ?? 10);

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
