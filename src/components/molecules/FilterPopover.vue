<template>
    <div ref="popoverRef" class="relative flex">
        <slot name="trigger" :open="open" :toggle="toggle" :close="close" />

        <div
            v-if="open"
            class="absolute right-0 sm:right-auto z-10 mt-12 sm:mt-2 w-[320px] origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-border focus:outline-none p-4 space-y-4"
            v-bind="bindObjectId(objectId)"
        >
            <h4 class="font-medium text-sm text-text">{{ title }}</h4>
            <slot :close="close" />
            <div v-if="$slots.actions" class="pt-2 flex justify-end">
                <slot name="actions" :close="close" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { bindObjectId } from "@/utils/objectId";

const props = withDefaults(
    defineProps<{
        open: boolean;
        title?: string;
        objectId?: string;
    }>(),
    {
        title: "Filters",
    },
);

const emit = defineEmits<{
    (e: "update:open", value: boolean): void;
}>();

const popoverRef = ref<HTMLElement | null>(null);

const close = () => emit("update:open", false);
const toggle = () => emit("update:open", !props.open);

const handleDocumentClick = (event: Event) => {
    if (!popoverRef.value?.contains(event.target as Node)) {
        close();
    }
};

onMounted(() => {
    document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleDocumentClick);
});
</script>
