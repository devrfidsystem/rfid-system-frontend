<template>
    <Card :class="cardClass" :object-id="`wdg_${objectIdPrefix}`">
        <h4
            class="mb-4 border-b border-border pb-3 text-base font-semibold text-text"
        >
            {{ title }}
        </h4>
        <div class="space-y-4">
            <div class="flex items-end gap-2">
                <div class="min-w-0 flex-1">
                    <Select
                        :model-value="modelValue"
                        :options="options"
                        :label="selectLabel"
                        :placeholder="selectPlaceholder"
                        :object-id="`cmb_${objectIdPrefix}Add`"
                        @update:model-value="
                            (value) => emit('update:modelValue', String(value))
                        "
                    />
                </div>
                <Button
                    variant="outline"
                    class="px-3"
                    :disabled="addDisabled"
                    :object-id="`btn_${objectIdPrefix}Add`"
                    @click="emit('add')"
                >
                    Add
                </Button>
            </div>

            <ul class="mt-4 space-y-2">
                <li
                    v-for="item in items"
                    :key="item.id"
                    class="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-secondary p-3"
                >
                    <span
                        class="min-w-0 truncate text-sm font-medium text-text"
                    >
                        {{ item.label }}
                    </span>
                    <Button
                        v-if="removable"
                        variant="danger"
                        size="sm"
                        class="px-2"
                        :disabled="submitting"
                        :object-id="`btn_${objectIdPrefix}Remove_${item.id}`"
                        @click="emit('remove', item)"
                    >
                        Remove
                    </Button>
                </li>
                <li
                    v-if="items.length === 0"
                    class="rounded-md border border-dashed border-border bg-surface-secondary/50 px-3 py-4 text-center text-sm text-text-secondary"
                >
                    {{ emptyText }}
                </li>
            </ul>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import Select from "@/components/atoms/Select.vue";

type SelectOption = {
    label: string;
    value: string;
};

export type AccessAssignmentItem = {
    id: string;
    label: string;
    subjectId?: string;
};

withDefaults(
    defineProps<{
        title: string;
        modelValue: string;
        options: SelectOption[];
        items: AccessAssignmentItem[];
        selectLabel: string;
        selectPlaceholder: string;
        emptyText: string;
        objectIdPrefix: string;
        addDisabled?: boolean;
        submitting?: boolean;
        removable?: boolean;
        cardClass?: string;
    }>(),
    {
        addDisabled: false,
        submitting: false,
        removable: true,
        cardClass: "",
    },
);

const emit = defineEmits<{
    (event: "update:modelValue", value: string): void;
    (event: "add"): void;
    (event: "remove", item: AccessAssignmentItem): void;
}>();
</script>
