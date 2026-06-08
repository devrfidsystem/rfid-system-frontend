<template>
    <div
        class="flex flex-wrap items-center justify-between gap-4 px-5 py-3 text-sm text-text-secondary"
        v-bind="bindObjectId(objectId)"
    >
        <p>
            Showing <span class="font-medium text-gray-900">{{ from }}</span> -
            <span class="font-medium text-gray-900">{{ to }}</span> of
            <span class="font-medium text-gray-900">{{ totalRows }}</span>
            records
        </p>
        <div class="flex items-center gap-2">
            <button
                type="button"
                class="inline-flex items-center justify-center rounded-md border border-border-default bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-workspace-bg focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="page <= 1"
                v-bind="
                    bindObjectId(objectId ? `btn_${objectId}Prev` : undefined)
                "
                @click="changePage(page - 1)"
            >
                Previous
            </button>
            <button
                type="button"
                class="inline-flex items-center justify-center rounded-md border border-border-default bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-workspace-bg focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="page >= totalPages"
                v-bind="
                    bindObjectId(objectId ? `btn_${objectId}Next` : undefined)
                "
                @click="changePage(page + 1)"
            >
                Next
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { bindObjectId } from "@/utils/objectId";

const props = defineProps<{
    page: number;
    totalPages: number;
    pageSize: number;
    totalRows: number;
    objectId?: string;
}>();

const emit = defineEmits<{
    (e: "update:page", value: number): void;
}>();

const changePage = (value: number) => {
    emit("update:page", value);
};

const from = computed(() => (props.page - 1) * props.pageSize + 1);
const to = computed(() =>
    Math.min(props.page * props.pageSize, props.totalRows),
);
</script>
