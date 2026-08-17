<template>
    <div
        class="flex flex-wrap items-center justify-between gap-4 rounded-t-md border-b border-border bg-surface px-4 py-3"
    >
        <div class="flex flex-1 min-w-[240px] items-center gap-3">
            <div v-if="showSearch !== false" class="w-full max-w-sm">
                <Input
                    :id="searchId"
                    v-model="search"
                    label="Search"
                    label-class="sr-only"
                    placeholder="Search..."
                    :object-id="searchObjectId"
                >
                    <template #icon>
                        <slot name="search-icon">
                            <Icon
                                :icon="Search"
                                :size="16"
                                class-name="text-text-secondary"
                            />
                        </slot>
                    </template>
                </Input>
            </div>
            <slot name="filters" />
        </div>
        <div class="flex items-center gap-3">
            <slot name="actions" :rows="rows" :visible-rows="visibleRows" />
            <div
                v-if="pageSizeOptions?.length"
                class="flex items-center gap-2 border-l border-border pl-3 text-xs text-text-secondary"
            >
                <Select
                    :id="pageSizeId"
                    v-model="localPageSize"
                    label="Rows"
                    label-class="text-xs font-medium text-text-secondary"
                    :options="pageSizeSelectOptions"
                    :object-id="pageSizeObjectId"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Icon from "@/components/atoms/Icon.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import { Search } from "lucide-vue-next";

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
const localPageSize = ref(
    String(props.pageSize ?? props.pageSizeOptions?.[0] ?? 10),
);
const searchId = `dt-search-${Math.random().toString(36).slice(2, 9)}`;
const pageSizeId = `dt-page-size-${Math.random().toString(36).slice(2, 9)}`;
const objectIdSuffix = computed(() => objectIdSafeValue(props.objectId));
const searchObjectId = computed(() =>
    objectIdSuffix.value ? `txt_${objectIdSuffix.value}Search` : undefined,
);
const pageSizeObjectId = computed(() =>
    objectIdSuffix.value ? `cmb_${objectIdSuffix.value}PageSize` : undefined,
);
const pageSizeSelectOptions = computed(() =>
    (props.pageSizeOptions ?? []).map((option) => ({
        label: String(option),
        value: String(option),
    })),
);

watch(search, (value) => emit("update:modelValue", value));
watch(
    () => props.modelValue,
    (value) => {
        if (value !== search.value) search.value = value ?? "";
    },
);

watch(localPageSize, (value) => emit("update:pageSize", Number(value)));
watch(
    () => props.pageSize,
    (value) => {
        const nextValue = String(value);
        if (nextValue !== localPageSize.value) localPageSize.value = nextValue;
    },
);

function objectIdSafeValue(objectId?: string) {
    return objectId?.replace(/^[^_]+_/, "") ?? "";
}
</script>
