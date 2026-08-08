<template>
    <Drawer
        :model-value="isOpen"
        :title="title"
        :description="
            isEdit
                ? 'Update master data entry.'
                : 'Create a new master data entry.'
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
                    <div
                        v-else-if="field.type === 'textarea'"
                        class="flex flex-col gap-1"
                    >
                        <label
                            :for="`form-${field.key}`"
                            class="font-medium text-text-secondary"
                            >{{ field.label }}</label
                        >
                        <textarea
                            :id="`txa_MasterForm_Field${field.key}`"
                            :value="String(localFormState[field.key] ?? '')"
                            :disabled="isFieldDisabled(field)"
                            class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors duration-150 placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary"
                            rows="2"
                            :object-id="`txa_MasterForm_Field${field.key}`"
                            @input="
                                (event) =>
                                    setFieldValue(
                                        field.key,
                                        (event.target as HTMLTextAreaElement)
                                            .value,
                                    )
                            "
                        />
                        <p
                            v-if="errors[field.key]"
                            class="text-xs text-signal-red"
                        >
                            {{ errors[field.key] }}
                        </p>
                    </div>
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
                    <div
                        v-else-if="field.type === 'file'"
                        class="flex flex-col gap-1"
                    >
                        <label
                            :for="`form-${field.key}`"
                            class="font-medium text-text-secondary"
                            >{{ field.label }}</label
                        >
                        <input
                            :id="`file_MasterForm_Field${field.key}`"
                            type="file"
                            :disabled="isFieldDisabled(field)"
                            class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors duration-150 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary"
                            :object-id="`file_MasterForm_Field${field.key}`"
                            @change="
                                (event) => handleFileChange(field.key, event)
                            "
                        />
                        <p
                            v-if="fileNames[field.key]"
                            class="text-xs text-text-secondary"
                        >
                            Selected: {{ fileNames[field.key] }}
                        </p>
                        <p
                            v-if="errors[field.key]"
                            class="text-xs text-signal-red"
                        >
                            {{ errors[field.key] }}
                        </p>
                    </div>
                </div>
            </div>
            <div
                class="mt-auto flex justify-end gap-3 border-t border-border pt-4"
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
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { X, Save } from "lucide-vue-next";
import type { MasterFormField } from "../entityConfig";
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
const fileNames = ref<Record<string, string>>({});
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
            fileNames.value = {};
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

const handleFileChange = (key: string, event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    localFormState.value[key] = file;
    fileNames.value[key] = file?.name ?? "";
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
