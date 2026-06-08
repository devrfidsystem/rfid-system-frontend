<template>
    <Modal :is-open="isOpen" :title="title" @close="closeModal">
        <form class="space-y-4" @submit.prevent="submitForm">
            <div v-for="field in formFields" :key="field.key" class="space-y-2">
                <Input
                    v-if="!field.type || field.type === 'text'"
                    v-model="localFormState[field.key]"
                    :label="field.label"
                    :placeholder="field.placeholder ?? field.label"
                    :object-id="`txt_MasterForm_Field${field.key}`"
                />
                <div
                    v-else-if="field.type === 'textarea'"
                    class="flex flex-col gap-1"
                >
                    <label
                        :for="`form-${field.key}`"
                        class="font-semibold text-gray-700"
                        >{{ field.label }}</label
                    >
                    <textarea
                        :id="`txa_MasterForm_Field${field.key}`"
                        v-model="localFormState[field.key]"
                        class="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
                        rows="2"
                        :object-id="`txa_MasterForm_Field${field.key}`"
                    />
                </div>
                <Select
                    v-else-if="field.type === 'select'"
                    :label="field.label"
                    :model-value="localFormState[field.key]"
                    :options="getOptions(field)"
                    :placeholder="field.placeholder ?? field.label"
                    :object-id="`cmb_MasterForm_Field${field.key}`"
                    @update:model-value="
                        (value) => (localFormState[field.key] = value)
                    "
                />
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    object-id="btn_MasterFormCancel"
                    @click="closeModal"
                >
                    <Icon :icon="X" :size="12" />
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    :loading="isSubmitting"
                    object-id="btn_MasterFormSave"
                >
                    <Icon :icon="Save" :size="12" />
                    {{ isEdit ? "Update" : "Save" }}
                </Button>
            </div>
        </form>
    </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Modal from "@/components/organisms/Modal.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { X, Save } from "lucide-vue-next";
import type { MasterFormField } from "../entityConfig";

const props = defineProps<{
    isOpen: boolean;
    title: string;
    formFields: MasterFormField[];
    initialState: Record<string, string>;
    isSubmitting: boolean;
    isEdit: boolean;
    uomOptions: { label: string; value: string }[];
    categoryOptions: { label: string; value: string }[];
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "submit", payload: Record<string, string>): void;
}>();

const localFormState = ref<Record<string, string>>({});

watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            localFormState.value = { ...props.initialState };
        }
    },
);

const getOptions = (field: MasterFormField) => {
    if (field.optionsKey === "uomId") return props.uomOptions;
    if (field.optionsKey === "categoryId") return props.categoryOptions;
    return [];
};

const closeModal = () => {
    emit("close");
};

const submitForm = () => {
    emit("submit", localFormState.value);
};
</script>
