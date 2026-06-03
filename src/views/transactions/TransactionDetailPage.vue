<template>
    <section class="space-y-6">
        <PageHeader
            :title="pageTitle"
            :description="pageDescription"
            tagline="Transaction Detail"
            back-link
            @back="handleBack"
        >
            <template #actions>
                <div
                    class="flex items-center gap-3"
                    v-if="record && record.status === 'DRAFT'"
                >
                    <Button
                        variant="outline"
                        class="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        @click="handleCancel"
                        :disabled="actionLoading"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        @click="handlePost"
                        :disabled="actionLoading"
                    >
                        Post Transaction
                    </Button>
                </div>
            </template>
        </PageHeader>

        <div v-if="loading" class="p-6">
            <LoadingState :lines="5" />
        </div>

        <div v-else-if="error" class="p-6">
            <div
                class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
                {{ error }}
            </div>
        </div>

        <template v-else-if="record">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card class="md:col-span-1">
                    <h3
                        class="text-base font-semibold text-gray-900 mb-4 border-b pb-3"
                    >
                        Document Info
                    </h3>
                    <div class="space-y-4">
                        <div v-for="col in headerColumns" :key="col.key">
                            <span
                                class="block text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >{{ col.label }}</span
                            >
                            <span
                                class="block text-sm text-gray-900 mt-1 font-medium"
                                >{{ record[col.key] || "-" }}</span
                            >
                        </div>
                    </div>
                </Card>

                <Card class="md:col-span-2" no-padding>
                    <div class="px-6 py-5 border-b border-gray-100">
                        <h3 class="text-base font-semibold text-gray-900">
                            Line Items
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Product
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Expected
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Actual
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr
                                    v-for="(line, idx) in lines"
                                    :key="line.id || idx"
                                >
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        <div class="font-medium">
                                            {{
                                                line.product?.name ||
                                                line.productName ||
                                                line.productId ||
                                                "-"
                                            }}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {{
                                                line.product?.code ||
                                                line.productCode ||
                                                "-"
                                            }}
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right"
                                    >
                                        {{
                                            line.expectedQty ?? line.qty ?? "-"
                                        }}
                                        {{ line.uom?.code || line.uomId || "" }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium"
                                    >
                                        {{ line.actualQty ?? line.qty ?? "-" }}
                                    </td>
                                </tr>
                                <tr v-if="!lines || lines.length === 0">
                                    <td
                                        colspan="3"
                                        class="px-6 py-8 text-center text-sm text-gray-500"
                                    >
                                        No line items found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </template>
    </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { reportConfigs } from "@/views/report/reportConfig";
import type { TransactionRecord } from "./types";

const props = defineProps<{
    transactionKey: TransactionKey;
    id: string;
}>();

const router = useRouter();
const loading = ref(true);
const actionLoading = ref(false);
const error = ref<string | null>(null);
const record = ref<TransactionRecord | null>(null);

const config = computed(() => {
    // We map transactionKey to reportKey, but if it's missing just use transactionKey
    // Wait, transactionToReportKey is not exported from useTransactionList, let's just use a local map or reportConfigs directly if possible.
    const keyMap: Record<string, string> = {
        inbound: "inbound",
        outbound: "outbound",
        relocation: "relocation",
        transfer: "transfer",
        return: "return",
        opname: "stock-opname",
    };
    const reportKey = keyMap[props.transactionKey] || props.transactionKey;
    return reportConfigs[reportKey as keyof typeof reportConfigs];
});

const headerColumns = computed(() => {
    return config.value?.columns || [];
});

const pageTitle = computed(() => {
    return record.value?.docNo || "Transaction Detail";
});

const pageDescription = computed(() => {
    return `Details for ${props.transactionKey} transaction`;
});

const lines = computed(() => {
    if (!record.value) return [];
    return (record.value.lines || record.value.items || []) as Record<
        string,
        any
    >[];
});

const handleBack = () => {
    router.push(`/transactions/${props.transactionKey}`);
};

const loadTransaction = async () => {
    loading.value = true;
    error.value = null;
    try {
        record.value = await transactionService.get(
            props.transactionKey,
            props.id,
        );
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : "Failed to load transaction details.";
    } finally {
        loading.value = false;
    }
};

const handlePost = async () => {
    if (!confirm("Are you sure you want to post this transaction?")) return;
    actionLoading.value = true;
    try {
        await transactionService.post(props.transactionKey, props.id);
        await loadTransaction();
    } catch (err) {
        alert(
            err instanceof Error ? err.message : "Failed to post transaction.",
        );
    } finally {
        actionLoading.value = false;
    }
};

const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this transaction?")) return;
    actionLoading.value = true;
    try {
        await transactionService.cancel(props.transactionKey, props.id);
        await loadTransaction();
    } catch (err) {
        alert(
            err instanceof Error
                ? err.message
                : "Failed to cancel transaction.",
        );
    } finally {
        actionLoading.value = false;
    }
};

onMounted(() => {
    loadTransaction();
});
</script>
