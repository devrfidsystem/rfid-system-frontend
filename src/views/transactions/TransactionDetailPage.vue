<template>
    <section class="space-y-6">
        <PageHeader
            :title="pageTitle"
            :description="pageDescription"
            :tagline="pageTagline"
            back-link
            @back="handleBack"
        >
            <template #actions>
                <div v-if="canShowActions" class="flex items-center gap-3">
                    <Button
                        v-if="canCancel"
                        variant="outline"
                        class="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        object-id="btn_TransactionDetailCancel"
                        :disabled="actionLoading"
                        @click="handleCancel"
                    >
                        {{
                            isRegister || isPutaway
                                ? "Cancel Task"
                                : isInbound
                                  ? "Cancel Document"
                                  : "Cancel"
                        }}
                    </Button>
                    <Button
                        v-if="canPost"
                        variant="primary"
                        object-id="btn_TransactionDetailPost"
                        :disabled="actionLoading"
                        @click="handlePost"
                    >
                        {{
                            isRegister || isPutaway
                                ? "Post Task"
                                : isInbound
                                  ? "Post Document"
                                  : "Post Transaction"
                        }}
                    </Button>
                    <Button
                        v-if="canComplete"
                        variant="primary"
                        object-id="btn_TransactionDetailComplete"
                        :disabled="actionLoading"
                        @click="handleComplete"
                    >
                        Complete Task
                    </Button>
                </div>
            </template>
        </PageHeader>

        <ConfirmDialog
            v-model="confirmationOpen"
            :title="confirmation?.title || 'Confirm Action'"
            :description="confirmation?.description || ''"
            :confirm-text="confirmation?.confirmText || 'Confirm'"
            :cancel-text="confirmation?.cancelText || 'Cancel'"
            :variant="confirmation?.variant || 'primary'"
            :loading="actionLoading"
            persistent
            object-id="dlg_TransactionDetailConfirm"
            @confirm="handleConfirmAction"
            @cancel="clearConfirmation"
        />

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
            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card
                    :class="isRegister ? 'md:col-span-3' : 'md:col-span-1'"
                    object-id="wdg_TransactionDetailInfo"
                >
                    <h3
                        class="mb-4 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900"
                    >
                        Document Info
                    </h3>
                    <div class="space-y-4">
                        <div v-for="col in headerColumns" :key="col.key">
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                {{ col.label }}
                            </span>
                            <template v-if="col.key === 'status'">
                                <Badge :tone="statusTone">
                                    {{ statusLabel }}
                                </Badge>
                            </template>
                            <span
                                v-else
                                class="mt-1 block text-sm font-medium text-gray-900"
                            >
                                {{
                                    String(
                                        getNestedValue(record, col.key) ?? "-",
                                    )
                                }}
                            </span>
                        </div>

                        <div
                            v-if="isOutbound && outboundReviewNote"
                            class="pt-2"
                        >
                            <div
                                class="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
                            >
                                {{ outboundReviewNote }}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card
                    v-if="isRegister"
                    class="md:col-span-3"
                    object-id="wdg_TransactionDetailRegisterMeta"
                >
                    <h3
                        class="mb-4 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900"
                    >
                        Task Meta
                    </h3>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Registered By
                            </span>
                            <span
                                class="mt-1 block text-sm font-medium text-gray-900"
                            >
                                {{
                                    getNestedValue(
                                        record,
                                        "registeredBy.fullName",
                                    ) || "-"
                                }}
                            </span>
                        </div>
                        <div>
                            <span
                                class="block text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                                Created By
                            </span>
                            <span
                                class="mt-1 block text-sm font-medium text-gray-900"
                            >
                                {{
                                    getNestedValue(
                                        record,
                                        "createdBy.fullName",
                                    ) || "-"
                                }}
                            </span>
                        </div>
                    </div>
                </Card>

                <OutboundDetailLines
                    v-if="isOutbound"
                    class="md:col-span-2"
                    :lines="lines"
                    :read-only="isOutboundReadOnly"
                    :status="statusLabel"
                />

                <Card
                    v-else
                    :class="isRegister ? 'md:col-span-3' : 'md:col-span-2'"
                    no-padding
                    object-id="wdg_TransactionDetailLines"
                >
                    <div class="border-b border-gray-100 px-6 py-5">
                        <h3 class="text-base font-semibold text-gray-900">
                            Line Items
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table
                            v-if="isRelocation"
                            class="min-w-full divide-y divide-gray-200"
                        >
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Product
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        From Location
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        To Location
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Qty
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
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
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {{
                                            line.fromLocation?.name ||
                                            line.fromLocation?.code ||
                                            line.fromLocationId ||
                                            "-"
                                        }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        {{
                                            line.toLocation?.name ||
                                            line.toLocation?.code ||
                                            line.toLocationId ||
                                            "-"
                                        }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500"
                                    >
                                        {{ line.qty ?? "-" }}
                                    </td>
                                </tr>
                                <tr v-if="!lines || lines.length === 0">
                                    <td
                                        colspan="4"
                                        class="px-6 py-8 text-center text-sm text-gray-500"
                                    >
                                        No line items found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table
                            v-else
                            class="min-w-full divide-y divide-gray-200"
                        >
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Product
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Expected
                                    </th>
                                    <th
                                        class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Actual
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
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
                                        <div
                                            v-if="
                                                line.sourceLocation ||
                                                line.targetLocation ||
                                                line.sourceLocationId ||
                                                line.targetLocationId
                                            "
                                            class="mt-1 text-xs text-gray-500"
                                        >
                                            {{
                                                line.sourceLocation?.name ||
                                                line.sourceLocation?.code ||
                                                line.sourceLocationId ||
                                                "-"
                                            }}
                                            ->
                                            {{
                                                line.targetLocation?.name ||
                                                line.targetLocation?.code ||
                                                line.targetLocationId ||
                                                "-"
                                            }}
                                        </div>
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500"
                                    >
                                        {{
                                            line.expectedQty ?? line.qty ?? "-"
                                        }}
                                        {{ line.uom?.code || line.uomId || "" }}
                                    </td>
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900"
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
import { computed, onMounted } from "vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import Badge from "@/components/atoms/Badge.vue";
import Button from "@/components/atoms/Button.vue";
import ConfirmDialog from "@/components/organisms/ConfirmDialog.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import type { TransactionKey } from "@/services/transactions.service";
import { useTransactionDetail } from "./composables/useTransactionDetail";
import { getNestedValue } from "./utils/getNestedValue";
import OutboundDetailLines from "./components/OutboundDetailLines.vue";

const props = defineProps<{
    transactionKey: TransactionKey;
    id: string;
}>();

const isRegister = computed(() => props.transactionKey === "register");
const isRelocation = computed(() => props.transactionKey === "relocation");
const isOutbound = computed(() => props.transactionKey === "outbound");

const {
    loading,
    actionLoading,
    error,
    record,
    headerColumns,
    pageTitle,
    pageDescription,
    pageTagline,
    lines,
    handleBack,
    loadTransaction,
    handlePost,
    handleCancel,
    handleComplete,
    confirmation,
    clearConfirmation,
    handleConfirmAction,
    isInbound,
    isPutaway,
    canShowActions,
    canPost,
    canCancel,
    canComplete,
    isOutboundReadOnly,
    statusLabel,
    statusTone,
    outboundReviewNote,
} = useTransactionDetail(props.transactionKey, props.id);

const confirmationOpen = computed({
    get: () => Boolean(confirmation.value),
    set: (value: boolean) => {
        if (!value) clearConfirmation();
    },
});

onMounted(() => {
    loadTransaction();
});
</script>
