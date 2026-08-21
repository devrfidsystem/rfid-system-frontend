<template>
    <Drawer
        :model-value="isOpen"
        :title="title"
        :description="
            isEdit
                ? 'Review field values before saving this reference record.'
                : 'Add a reference record used by warehouse workflows.'
        "
        side="right"
        :width="drawerWidth"
        @update:model-value="closeModal"
        @close="closeModal"
    >
        <form class="flex h-full flex-col gap-6" @submit.prevent="submitForm">
            <div :class="fieldGridClass">
                <div
                    v-for="field in formFields"
                    :key="field.key"
                    class="space-y-2"
                    :class="fieldSpanClass(field)"
                >
                    <template
                        v-if="
                            field.key === 'items' &&
                            localFormState.type !== 'list'
                        "
                    />
                    <Input
                        v-else-if="!field.type || field.type === 'text'"
                        :model-value="String(localFormState[field.key] ?? '')"
                        :label="field.label"
                        :placeholder="field.placeholder ?? field.label"
                        :disabled="isFieldDisabled(field)"
                        :error="errors[field.key]"
                        :object-id="`txt_MasterForm_Field${field.key}`"
                        @update:model-value="
                            (value) => setFieldValue(field.key, value)
                        "
                    />
                    <Input
                        v-else-if="field.type === 'number'"
                        :model-value="String(localFormState[field.key] ?? '')"
                        :label="field.label"
                        :placeholder="field.placeholder ?? field.label"
                        type="number"
                        :disabled="isFieldDisabled(field)"
                        :error="errors[field.key]"
                        :object-id="`num_MasterForm_Field${field.key}`"
                        @update:model-value="
                            (value) => setFieldValue(field.key, value)
                        "
                    />
                    <Input
                        v-else-if="field.type === 'date'"
                        :model-value="String(localFormState[field.key] ?? '')"
                        :label="field.label"
                        :placeholder="field.placeholder ?? field.label"
                        type="date"
                        :disabled="isFieldDisabled(field)"
                        :error="errors[field.key]"
                        :object-id="`dat_MasterForm_Field${field.key}`"
                        @update:model-value="
                            (value) => setFieldValue(field.key, value)
                        "
                    />
                    <Textarea
                        v-else-if="field.type === 'textarea'"
                        :model-value="String(localFormState[field.key] ?? '')"
                        :label="field.label"
                        :placeholder="field.placeholder ?? field.label"
                        :disabled="isFieldDisabled(field)"
                        :error="errors[field.key]"
                        :object-id="`txa_MasterForm_Field${field.key}`"
                        :rows="2"
                        @update:model-value="
                            (value) => setFieldValue(field.key, value)
                        "
                    />
                    <Select
                        v-else-if="field.type === 'select'"
                        :label="field.label"
                        :model-value="String(localFormState[field.key] ?? '')"
                        :options="getOptions(field)"
                        :placeholder="field.placeholder ?? field.label"
                        :disabled="isFieldDisabled(field)"
                        :error="errors[field.key]"
                        :object-id="`cmb_MasterForm_Field${field.key}`"
                        @update:model-value="
                            (value) => setFieldValue(field.key, value)
                        "
                    />
                    <FileInput
                        v-else-if="field.type === 'file'"
                        :label="field.label"
                        :disabled="isFieldDisabled(field)"
                        :selected-file="getSelectedFile(field.key)"
                        :error="errors[field.key]"
                        :object-id="`file_MasterForm_Field${field.key}`"
                        @change="(file) => handleFileChange(field.key, file)"
                    />
                </div>
            </div>
            <div
                class="mt-auto flex justify-between gap-3 border-t border-border pt-4"
            >
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
    </Drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Drawer from "@/components/organisms/Drawer.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Textarea from "@/components/atoms/Textarea.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import FileInput from "@/components/ui/form/FileInput.vue";
import { X, Save } from "lucide-vue-next";
import type { MasterFormField } from "@/domain/master/entityConfig";
import { validateMasterForm } from "../masterFormValidation";

const props = defineProps<{
    isOpen: boolean;
    title: string;
    formFields: MasterFormField[];
    initialState: Record<string, string | File | null>;
    isSubmitting: boolean;
    isEdit: boolean;
    uomOptions?: { label: string; value: string }[];
    categoryOptions?: { label: string; value: string }[];
    supplierOptions?: { label: string; value: string }[];
    customerOptions?: { label: string; value: string }[];
    warehouseOptions?: { label: string; value: string }[];
    locationOptions?: { label: string; value: string }[];
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "submit", payload: Record<string, string | File | null>): void;
}>();

const localFormState = ref<Record<string, string | File | null>>({});
const errors = ref<Record<string, string>>({});

const isProductForm = computed(() =>
    props.formFields.some(
        (field) =>
            field.key === "imageFile" || field.key.startsWith("attribute:"),
    ),
);

const drawerWidth = computed(() => (isProductForm.value ? "lg" : "md"));

const fieldGridClass = computed(() =>
    isProductForm.value ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-6",
);

watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            localFormState.value = { ...props.initialState };
            errors.value = {};
        }
    },
);

const getOptions = (field: MasterFormField) => {
    if (field.options) return field.options;
    if (field.optionsKey === "uomId") return props.uomOptions || [];
    if (field.optionsKey === "categoryId") return props.categoryOptions || [];
    if (field.optionsKey === "supplierId") return props.supplierOptions || [];
    if (field.optionsKey === "customerId") return props.customerOptions || [];
    if (field.optionsKey === "warehouseId") return props.warehouseOptions || [];
    if (field.optionsKey === "parentId") return props.locationOptions || [];
    return [];
};

const isFieldDisabled = (field: MasterFormField) =>
    props.isEdit && (field.key === "code" || field.key === "warehouseId");

const fieldSpanClass = (field: MasterFormField) =>
    field.type === "file" ? "md:col-span-2" : "";

const handleFileChange = (key: string, file: File | null) => {
    localFormState.value[key] = file;
};

const getSelectedFile = (key: string) => {
    const value = localFormState.value[key];
    return value instanceof File ? value : null;
};

const setFieldValue = (key: string, value: string) => {
    localFormState.value[key] = value;
    if (errors.value[key]) {
        const nextErrors = { ...errors.value };
        delete nextErrors[key];
        errors.value = nextErrors;
    }
};

const validate = (): boolean => {
    const nextErrors = validateMasterForm(
        props.formFields,
        localFormState.value,
        isFieldDisabled,
    );
    errors.value = nextErrors;
    return Object.keys(nextErrors).length === 0;
};

const closeModal = () => {
    emit("close");
};

const submitForm = () => {
    if (!validate()) return;
    emit("submit", localFormState.value);
};
</script>
