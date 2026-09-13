<template>
    <div>
        <label
            class="flex gap-2 text-sm text-text"
            :class="align === 'start' ? 'items-start' : 'items-center'"
            :for="objectId"
        >
            <input
                :id="objectId"
                :checked="modelValue"
                type="checkbox"
                class="h-4 w-4 rounded border-border text-primary-600 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30"
                :class="align === 'start' ? 'mt-0.5' : ''"
                :data-testid="objectId"
                :object-id="objectId"
                :aria-invalid="error ? 'true' : undefined"
                :aria-describedby="error ? `${objectId}Error` : undefined"
                @blur="emit('blur')"
                @change="emitValue"
            />
            <span>{{ label }}</span>
        </label>
        <p
            v-if="error"
            :id="`${objectId}Error`"
            class="mt-1 text-xs text-danger-600"
        >
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        modelValue: boolean;
        label: string;
        objectId: string;
        error?: string;
        align?: "center" | "start";
    }>(),
    {
        align: "center",
    },
);

const emit = defineEmits<{
    (event: "update:modelValue", value: boolean): void;
    (event: "blur"): void;
}>();

const emitValue = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    emit("update:modelValue", Boolean(target?.checked));
};
</script>
