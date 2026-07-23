<template>
    <Modal
        :is-open="isOpen"
        :title="`Import ${title}`"
        object-id="dlg_MasterHeaderImport"
        @close="closeDialog"
    >
        <div class="space-y-5">
            <div class="space-y-2">
                <p class="text-sm text-text-secondary">
                    Download the Excel template, fill it, then upload the
                    completed file.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    object-id="btn_MasterHeaderExportTemplate"
                    @click="$emit('export-template')"
                >
                    <Icon :icon="Download" :size="12" />
                    Export Template
                </Button>
            </div>

            <div class="space-y-2">
                <label
                    for="file_MasterHeaderImport"
                    class="text-sm font-medium text-text-secondary"
                >
                    Excel File
                </label>
                <input
                    id="file_MasterHeaderImport"
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors duration-150 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                    object-id="file_MasterHeaderImport"
                    @change="handleImportFile"
                />
                <p v-if="selectedImportFile" class="text-xs text-text-secondary">
                    Selected: {{ selectedImportFile.name }}
                </p>
            </div>

            <div class="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    object-id="btn_MasterHeaderImportCancel"
                    @click="closeDialog"
                >
                    <Icon :icon="X" :size="12" />
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    :disabled="!selectedImportFile"
                    :loading="isImporting"
                    object-id="btn_MasterHeaderImportSubmit"
                    @click="submitImportFile"
                >
                    <Icon :icon="Upload" :size="12" />
                    Import
                </Button>
            </div>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import Modal from "@/components/organisms/Modal.vue";
import { Download, Upload, X } from "lucide-vue-next";

const props = defineProps<{
    isOpen: boolean;
    title: string;
    isImporting?: boolean;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "import", file: File): void;
    (e: "export-template"): void;
}>();

const selectedImportFile = ref<File | null>(null);

const closeDialog = () => {
    if (props.isImporting) return;
    selectedImportFile.value = null;
    emit("close");
};

const handleImportFile = (event: Event) => {
    const input = event.target as HTMLInputElement | null;
    selectedImportFile.value = input?.files?.[0] ?? null;
};

const submitImportFile = () => {
    if (!selectedImportFile.value) return;
    emit("import", selectedImportFile.value);
};

watch(
    () => props.isOpen,
    (isOpen) => {
        if (!isOpen) selectedImportFile.value = null;
    },
);

watch(
    () => props.isImporting,
    (isImporting, wasImporting) => {
        if (!isImporting && wasImporting) {
            selectedImportFile.value = null;
            emit("close");
        }
    },
);
</script>
