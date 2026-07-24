<template>
    <div
        class="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary"
    >
        <div>
            Showing
            <span class="font-semibold text-text"
                >{{ rangeStart }} - {{ rangeEnd }}</span
            >
            of
            <span class="font-semibold text-text">{{ total }}</span>
            records
        </div>

        <div class="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="disabled || page <= 1"
                @click="goToPage(page - 1)"
            >
                Prev
            </Button>
            <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="disabled || page >= totalPages"
                @click="goToPage(page + 1)"
            >
                Next
            </Button>

            <label v-if="pageSizeOptions.length" :for="id">
                <span
                    class="ml-2 text-xs font-medium uppercase tracking-wide text-text-secondary"
                    >Rows per page</span
                >
            </label>
            <select
                v-if="pageSizeOptions.length"
                :id="id"
                class="h-[var(--control-h-sm)] rounded-md border border-border bg-surface px-3 text-xs text-text transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                :value="pageSize"
                :disabled="disabled"
                @change="onPageSizeSelectChange($event)"
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
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import Button from "@/components/atoms/Button.vue";

const props = defineProps<{
    page: number;
    pageSize: number;
    total: number;
    pageSizeOptions?: number[];
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:page", value: number): void;
    (e: "update:pageSize", value: number): void;
}>();

const id = `pagination-select-${Math.random().toString(36).slice(2, 9)}`;

const totalPages = computed(() => {
    if (!props.pageSize) return 1;
    return Math.max(1, Math.ceil(props.total / props.pageSize));
});

const rangeStart = computed(() =>
    props.total === 0 ? 0 : (clampedPage.value - 1) * props.pageSize + 1,
);
const rangeEnd = computed(() =>
    Math.min(props.total, clampedPage.value * props.pageSize),
);
const clampedPage = computed(() =>
    Math.min(Math.max(1, props.page), totalPages.value),
);
const pageSizeOptions = computed(() =>
    props.pageSizeOptions?.length ? props.pageSizeOptions : [10, 20, 50],
);

const goToPage = (next: number) => {
    if (props.disabled) return;
    const target = Math.min(Math.max(1, next), totalPages.value);
    emit("update:page", target);
};

const onPageSizeSelectChange = (event: Event) => {
    if (props.disabled) return;
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;
    const numeric = Number(target.value);
    emit("update:pageSize", numeric);
};

watch(totalPages, (pages) => {
    if (props.page > pages) {
        emit("update:page", pages);
    }
});
</script>
