<template>
    <Modal :is-open="isOpen" title="Confirm Delete" @close="closeModal">
        <div class="space-y-4">
            <p class="text-sm text-text-secondary">
                Are you sure you want to delete this record?
            </p>
            <div class="flex justify-end gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    object-id="btn_MasterDeleteCancel"
                    @click="closeModal"
                >
                    <Icon :icon="X" :size="12" />
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    :loading="isDeleting"
                    object-id="btn_MasterDeleteConfirm"
                    @click="confirmDelete"
                >
                    <Icon :icon="Trash2" :size="12" />
                    Delete
                </Button>
            </div>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import Modal from "@/components/organisms/Modal.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import { X, Trash2 } from "lucide-vue-next";

defineProps<{
    isOpen: boolean;
    isDeleting: boolean;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "confirm"): void;
}>();

const closeModal = () => emit("close");
const confirmDelete = () => emit("confirm");
</script>
