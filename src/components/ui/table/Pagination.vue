<template>
    <div
        class="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500"
    >
        <div>
            Showing
            <span class="font-semibold text-gray-900"
                >{{ rangeStart }} - {{ rangeEnd }}</span
            >
            of
            <span class="font-semibold text-gray-900">{{ total }}</span>
            records
        </div>

        <div class="flex items-center gap-2">
            <button
                type="button"
                class="rounded-md border border-gray-200 px-3 py-1 transition disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400"
                :disabled="disabled || page <= 1"
                @click="goToPage(page - 1)"
            >
                Prev
            </button>
            <button
                type="button"
                class="rounded-md border border-gray-200 px-3 py-1 transition disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400"
                :disabled="disabled || page >= totalPages"
                @click="goToPage(page + 1)"
            >
                Next
            </button>

            <label v-if="pageSizeOptions.length" :for="id">
                <span
                    class="text-xs font-medium uppercase tracking-wider text-gray-500 ml-2"
                    >Rows per page</span
                >
            </label>
            <select
                v-if="pageSizeOptions.length"
                :id="id"
                class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
