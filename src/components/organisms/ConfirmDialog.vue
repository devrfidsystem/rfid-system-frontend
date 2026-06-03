<template>
    <Dialog
        :model-value="modelValue"
        :title="title"
        :description="description"
        :close-on-backdrop="closeOnBackdrop"
        :close-on-esc="closeOnEsc"
        :persistent="persistent"
        initial-focus="close"
        @update:model-value="emitUpdate"
    >
        <template #footer>
            <div class="flex justify-end gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    :disabled="loading"
                    @click="handleCancel"
                >
                    {{ cancelTextComputed }}
                </Button>
                <Button
                    :variant="variant === 'danger' ? 'danger' : 'primary'"
                    size="sm"
                    type="button"
                    :loading="loading"
                    :disabled="disabled || loading"
                    @click="handleConfirm"
                >
                    {{ confirmTextComputed }}
                </Button>
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/atoms/Button.vue";
import Dialog from "@/components/organisms/Dialog.vue";

const props = defineProps<{
    modelValue: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger";
    loading?: boolean;
    disabled?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    closeOnConfirm?: boolean;
    persistent?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "confirm"): void;
    (e: "cancel"): void;
}>();

const confirmTextComputed = computed(() => props.confirmText ?? "Confirm");
const cancelTextComputed = computed(() => props.cancelText ?? "Cancel");

const handleConfirm = () => {
    emit("confirm");
    if (props.closeOnConfirm ?? true) {
        emit("update:modelValue", false);
    }
};

const handleCancel = () => {
    emit("cancel");
    emit("update:modelValue", false);
};

const emitUpdate = (value: boolean) => {
    emit("update:modelValue", value);
};
</script>
