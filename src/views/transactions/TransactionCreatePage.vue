<template>
    <section class="space-y-6">
        <PageHeader
            :title="`New ${transactionTitle}`"
            :description="`Create a new ${transactionKey} transaction`"
            tagline="Transactions"
            back-link
            @back="handleBack"
        />

        <form @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Header Form -->
                <Card class="md:col-span-1">
                    <h3
                        class="text-base font-semibold text-gray-900 mb-4 border-b pb-3"
                    >
                        Document Details
                    </h3>
                    <div class="space-y-4">
                        <Input
                            id="transactionDate"
                            v-model="form.transactionDate"
                            label="Transaction Date"
                            type="date"
                            required
                        />

                        <Select
                            v-if="showWarehouseField"
                            v-model="form.warehouseId"
                            :options="warehouseOptions"
                            label="Warehouse"
                            placeholder="Select warehouse"
                            required
                        />

                        <Select
                            v-if="showPartnerField"
                            v-model="form.partnerId"
                            :options="partnerOptions"
                            :label="partnerLabel"
                            placeholder="Select partner"
                            required
                        />

                        <Input
                            id="notes"
                            v-model="form.notes"
                            label="Notes / Description"
                            placeholder="Optional notes"
                        />
                    </div>
                </Card>

                <!-- Line Items Form -->
                <Card class="md:col-span-2" no-padding>
                    <div
                        class="px-6 py-5 border-b border-gray-100 flex justify-between items-center"
                    >
                        <h3 class="text-base font-semibold text-gray-900">
                            Line Items
                        </h3>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            @click="addLine"
                        >
                            Add Line
                        </Button>
                    </div>
                    <div class="overflow-x-auto p-6 space-y-4">
                        <div
                            v-for="(line, idx) in form.lines"
                            :key="idx"
                            class="flex gap-4 items-end"
                        >
                            <div class="flex-1">
                                <Select
                                    v-model="line.productId"
                                    :options="productOptions"
                                    label="Product"
                                    placeholder="Select a product"
                                    required
                                />
                            </div>
                            <div class="w-32">
                                <Input
                                    :id="`qty-${idx}`"
                                    v-model="line.qty"
                                    label="Quantity"
                                    type="number"
                                    min="1"
                                    required
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                class="text-rose-600 border-rose-200 hover:bg-rose-50 px-3"
                                @click="removeLine(idx)"
                            >
                                Remove
                            </Button>
                        </div>
                        <p
                            v-if="form.lines.length === 0"
                            class="text-sm text-gray-500 text-center py-4"
                        >
                            No line items added yet. Click "Add Line" to begin.
                        </p>
                    </div>
                    <div
                        class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            @click="handleBack"
                            :disabled="submitting"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            :disabled="submitting || form.lines.length === 0"
                        >
                            {{ submitting ? "Saving..." : "Save Transaction" }}
                        </Button>
                    </div>
                </Card>
            </div>
        </form>
    </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import {
    transactionService,
    type TransactionKey,
} from "@/services/transactions.service";
import { masterService } from "@/services/master.service";

const props = defineProps<{
    transactionKey: TransactionKey;
}>();

const router = useRouter();
const submitting = ref(false);

const form = ref({
    transactionDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    partnerId: "",
    notes: "",
    lines: [] as { productId: string; qty: string }[],
});

const transactionTitle = computed(() => {
    const titles: Record<string, string> = {
        inbound: "Inbound",
        outbound: "Outbound",
        relocation: "Relocation",
        transfer: "Transfer",
        return: "Return",
        opname: "Stock Opname",
    };
    return titles[props.transactionKey] || props.transactionKey;
});

const showWarehouseField = computed(() => {
    return ["inbound", "outbound", "return", "opname"].includes(
        props.transactionKey,
    );
});

const showPartnerField = computed(() => {
    return ["inbound", "outbound", "return"].includes(props.transactionKey);
});

const partnerLabel = computed(() => {
    return props.transactionKey === "inbound" ? "Supplier" : "Customer";
});

const warehouseOptions = ref<{ label: string; value: string }[]>([]);
const partnerOptions = ref<{ label: string; value: string }[]>([]);
const productOptions = ref<{ label: string; value: string }[]>([]);

const addLine = () => {
    form.value.lines.push({ productId: "", qty: "1" });
};

const removeLine = (idx: number) => {
    form.value.lines.splice(idx, 1);
};

const handleBack = () => {
    router.push(`/transactions/${props.transactionKey}`);
};

const loadOptions = async () => {
    try {
        if (showWarehouseField.value) {
            const whResponse = await masterService.fetchList("warehouses", {
                limit: 100,
            });
            warehouseOptions.value = whResponse.items.map((w) => ({
                label: `${(w as any).code} - ${(w as any).name}`,
                value: String(w.id),
            }));
        }

        if (showPartnerField.value) {
            const partnerKey =
                props.transactionKey === "inbound" ? "suppliers" : "customers";
            const pResponse = await masterService.fetchList(partnerKey as any, {
                limit: 100,
            });
            partnerOptions.value = pResponse.items.map((p) => ({
                label: String((p as any).name || (p as any).code),
                value: String(p.id),
            }));
        }

        const prodResponse = await masterService.fetchList("products", {
            limit: 200,
        });
        productOptions.value = prodResponse.items.map((p) => ({
            label: `${(p as any).code} - ${(p as any).name}`,
            value: String(p.id),
        }));
    } catch (err) {
        console.error("Failed to load options", err);
    }
};

const handleSubmit = async () => {
    if (form.value.lines.length === 0) {
        alert("Please add at least one line item.");
        return;
    }

    submitting.value = true;
    try {
        const payload: Record<string, any> = {
            transactionDate: form.value.transactionDate
                ? new Date(form.value.transactionDate).toISOString()
                : undefined,
            notes: form.value.notes,
            lines: form.value.lines.map((l) => ({
                productId: l.productId,
                expectedQty: Number(l.qty),
                qty: Number(l.qty),
            })),
        };

        if (showWarehouseField.value) {
            payload.warehouseId = form.value.warehouseId;
        }

        if (showPartnerField.value) {
            if (props.transactionKey === "inbound")
                payload.supplierId = form.value.partnerId;
            if (props.transactionKey === "outbound")
                payload.customerId = form.value.partnerId;
        }

        await transactionService.create(props.transactionKey, payload);
        router.push(`/transactions/${props.transactionKey}`);
    } catch (err) {
        alert(
            err instanceof Error
                ? err.message
                : "Failed to create transaction.",
        );
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    loadOptions();
});
</script>
