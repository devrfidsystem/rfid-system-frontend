<template>
    <input
        :id="id"
        type="checkbox"
        :checked="checked"
        class="h-4 w-4 rounded border border-border text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        v-bind="bindObjectId(objectId)"
        @change="emitChecked"
    />
</template>

<script setup lang="ts">
import { bindObjectId } from "@/utils/objectId";

defineProps<{
    id: string;
    checked: boolean;
    objectId?: string;
}>();

const emit = defineEmits<{
    (event: "change", value: boolean): void;
}>();

const emitChecked = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    emit("change", Boolean(target?.checked));
};
</script>
