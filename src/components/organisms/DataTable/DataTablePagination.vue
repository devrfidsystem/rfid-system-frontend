<template>
    <div
        class="flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-sm text-text-secondary"
        v-bind="bindObjectId(objectId)"
    >
        <p>
            Showing <span class="font-medium text-text">{{ from }}</span> -
            <span class="font-medium text-text">{{ to }}</span> of
            <span class="font-medium text-text">{{ totalRows }}</span>
            records
        </p>
        <div class="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="page <= 1"
                v-bind="
                    bindObjectId(objectId ? `btn_${objectId}Prev` : undefined)
                "
                @click="changePage(page - 1)"
            >
                Previous
            </Button>
            <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="page >= totalPages"
                v-bind="
                    bindObjectId(objectId ? `btn_${objectId}Next` : undefined)
                "
                @click="changePage(page + 1)"
            >
                Next
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/atoms/Button.vue";
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
