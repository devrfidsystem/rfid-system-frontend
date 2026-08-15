<template>
    <section class="space-y-6">
        <PageHeader
            title="Registered EPC"
            description="Registered EPC tags and their products."
            tagline="RFID"
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
                <h3 class="text-base font-semibold text-text">
                    Registered EPC List
                </h3>
            </div>
            <div v-if="loading" class="p-6 text-sm text-text-secondary">
                Loading EPC tags...
            </div>
            <div v-else-if="error" class="p-6 text-sm text-danger-600">
                {{ error }}
            </div>
            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-border text-sm">
                    <thead
                        class="bg-surface-secondary text-left text-xs font-semibold uppercase text-text-secondary"
                    >
                        <tr>
                            <th class="px-6 py-3">EPC</th>
                            <th class="px-6 py-3">Product</th>
                            <th class="px-6 py-3">Status</th>
                            <th class="px-6 py-3">Registered By</th>
                            <th class="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                        <tr v-for="tag in items" :key="tag.id">
                            <td class="px-6 py-4 font-medium text-text">
                                {{ tag.epcCode }}
                            </td>
                            <td class="px-6 py-4 text-text">
                                {{ formatProduct(tag) }}
                            </td>
                            <td class="px-6 py-4 text-text">
                                {{ tag.status }}
                            </td>
                            <td class="px-6 py-4 text-text">
                                {{ tag.userName || "-" }}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <Button
                                    type="button"
                                    variant="outline"
                                    class="border-danger-500/30 text-danger-600 hover:bg-danger-50"
                                    :disabled="deleting"
                                    :object-id="`btn_TagRegistrationDelete_${tag.id}`"
                                    @click="handleDelete(tag.id)"
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                        <tr v-if="items.length === 0">
                            <td
                                colspan="5"
                                class="px-6 py-8 text-center text-text-secondary"
                            >
                                No registered EPC tags found.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import { useNotifier } from "@/composable/useNotifier";
import { useRfidTags } from "@/composable/useRfidTags";
import { masterService } from "@/services/master.service";
import { useAuthStore } from "@/store/auth.store";
import type { RfidTag } from "@/api/feature/dto/rfid.dto";

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

const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this registered EPC?");
    if (!confirmed) return;
    try {
        await deleteTag(id);
        notifySuccess("EPC deleted successfully.");
    } catch (err) {
        notifyError(
            err instanceof Error ? err.message : "Failed to delete EPC.",
        );
    }
};

const formatProduct = (tag: RfidTag) => {
    if (tag.productCode && tag.productName) {
        return `${tag.productCode} - ${tag.productName}`;
    }
    return tag.productName || tag.productId || "-";
};

onMounted(() => {
    void loadProducts();
});
</script>
