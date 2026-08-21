<template>
    <section class="space-y-6">
        <PageHeader
            title="Registered EPC"
            description="Registered EPC tags and their products."
            tagline="RFID"
        />

        <ConfirmDialog
            v-model="deleteConfirmationOpen"
            title="Delete Registered EPC"
            description="This EPC registration will be removed from the active tag list."
            confirm-text="Delete"
            cancel-text="Cancel"
            variant="danger"
            :loading="deleting"
            persistent
            object-id="dlg_TagRegistrationDeleteConfirm"
            @confirm="confirmDelete"
            @cancel="clearDeleteConfirm"
        />

        <Card object-id="wdg_TagRegistrationCreate">
            <form
                class="grid grid-cols-1 gap-4 md:grid-cols-4"
                @submit.prevent="handleRegister"
            >
                <Input
                    id="txt_TagRegistrationEpc"
                    v-model="form.epcCode"
                    label="EPC"
                    placeholder="Enter EPC hex"
                    required
                    object-id="txt_TagRegistrationEpc"
                />
                <Select
                    v-model="form.productId"
                    :options="productOptions"
                    label="Product"
                    placeholder="Select product"
                    required
                    object-id="cmb_TagRegistrationProduct"
                />
                <div class="flex items-end gap-2 md:col-span-2">
                    <Button
                        type="submit"
                        variant="primary"
                        :disabled="registering"
                        object-id="btn_TagRegistrationSubmit"
                    >
                        {{ registering ? "Registering..." : "Register EPC" }}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        object-id="btn_TagRegistrationRefresh"
                        @click="refreshList"
                    >
                        Refresh
                    </Button>
                </div>
            </form>
        </Card>

        <Card no-padding object-id="wdg_TagRegistrationList">
            <div class="border-b border-border px-6 py-4">
                <ToolbarTitle title="Registered EPC List" />
            </div>
            <DataTable
                object-id="TagRegistrationList"
                bare
                :rows="tableRows"
                :columns="rfidTagColumns"
                :row-key="(row) => String(row.id ?? '')"
                :loading="loading"
                :load-error="error ?? undefined"
                :show-search="false"
            >
                <template #status="{ row }">
                    <Badge :tone="getRfidStatusTone(String(row.status))">
                        {{ formatRfidStatus(String(row.status)) }}
                    </Badge>
                </template>
                <template #rowActions="{ row }">
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        :disabled="deleting"
                        :object-id="`btn_TagRegistrationDelete_${row.id}`"
                        @click="openDeleteConfirm(String(row.id))"
                    >
                        <Icon :icon="Trash2" :size="12" />
                        Delete
                    </Button>
                </template>
            </DataTable>
        </Card>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import Badge from "@/components/atoms/Badge.vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import ConfirmDialog from "@/components/organisms/ConfirmDialog.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import { useNotifier } from "@/composable/useNotifier";
import { useRfidTags } from "@/composable/useRfidTags";
import { masterService } from "@/services/master.service";
import { useAuthStore } from "@/store/auth.store";
import { Trash2 } from "lucide-vue-next";
import {
    formatRfidStatus,
    getRfidStatusTone,
    rfidTagColumns,
    toRfidTagRows,
} from "./rfidTagTable";

const authStore = useAuthStore();
const { notifyError, notifySuccess } = useNotifier();
const {
    items,
    loading,
    error,
    registering,
    deleting,
    registerTag,
    deleteTag,
    refreshList,
} = useRfidTags({ autoFetch: true });

const form = reactive({
    epcCode: "",
    productId: "",
});
const productOptions = ref<Array<{ label: string; value: string }>>([]);
const deleteConfirmationOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);
const tableRows = computed(() => toRfidTagRows(items.value));

const loadProducts = async () => {
    const response = await masterService.fetchList("products", { limit: 200 });
    productOptions.value = response.items.map((product) => ({
        label: `${product.code} - ${product.name}`,
        value: String(product.id),
    }));
};

const handleRegister = async () => {
    const companyId = authStore.currentCompanyId;
    if (!companyId) {
        notifyError("No active company found.");
        return;
    }
    try {
        await registerTag({
            companyId,
            productId: form.productId,
            epcCode: form.epcCode,
        });
        notifySuccess("EPC registered successfully.");
        form.epcCode = "";
        form.productId = "";
    } catch (err) {
        notifyError(
            err instanceof Error ? err.message : "Failed to register EPC.",
        );
    }
};

const openDeleteConfirm = (id: string) => {
    pendingDeleteId.value = id;
    deleteConfirmationOpen.value = true;
};

const clearDeleteConfirm = () => {
    pendingDeleteId.value = null;
    deleteConfirmationOpen.value = false;
};

const confirmDelete = async () => {
    if (!pendingDeleteId.value) return;
    try {
        await deleteTag(pendingDeleteId.value);
        notifySuccess("EPC deleted successfully.");
        clearDeleteConfirm();
    } catch (err) {
        notifyError(
            err instanceof Error ? err.message : "Failed to delete EPC.",
        );
    }
};

onMounted(() => {
    void loadProducts();
});
</script>
