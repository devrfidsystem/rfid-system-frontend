<template>
    <Card
        class="md:col-span-2 h-full flex flex-col"
        no-padding
        object-id="wdg_TransactionLineItems"
    >
        <div
            class="px-6 py-5 border-b border-border flex justify-between items-center"
        >
            <ToolbarTitle title="Line Items" />
            <Button
                type="button"
                size="sm"
                variant="outline"
                object-id="btn_TransactionLineItemsAdd"
                @click="$emit('add-line')"
                >Add Line</Button
            >
        </div>
        <div class="flex-1 overflow-x-auto p-6 space-y-4">
            <div
                v-for="(line, idx) in lines"
                :key="idx"
                class="flex flex-col xl:flex-row xl:flex-wrap gap-4 xl:items-end border-b border-border xl:border-none pb-6 xl:pb-0 last:border-0"
            >
                <div class="flex-1">
                    <Select
                        v-model="line.productId"
                        :options="productOptions"
                        label="Product"
                        placeholder="Select a product"
                        required
                        :object-id="`cmb_TransactionLineItemsProduct_Row${idx}`"
                    />
                    <p
                        v-if="productAttributeSummaries[line.productId]"
                        class="mt-1 text-xs text-text-secondary"
                        :object-id="`txt_TransactionLineItemsAttributes_Row${idx}`"
                    >
                        {{ productAttributeSummaries[line.productId] }}
                    </p>
                </div>

                <div
                    v-if="
                        showSingleWarehouse &&
                        !isRelocation &&
                        !showPutawayLocations
                    "
                    class="w-full xl:w-48"
                >
                    <Select
                        v-model="line.locationId"
                        :options="locationOptions"
                        label="Location"
                        placeholder="Select location"
                        required
                        :object-id="`cmb_TransactionLineItemsLocation_Row${idx}`"
                    />
                </div>

                <template v-if="showPutawayLocations">
                    <div class="w-full xl:w-48">
                        <Select
                            v-model="line.fromLocationId"
                            :options="locationOptions"
                            label="Source Location"
                            placeholder="Select source location"
                            required
                            :object-id="`cmb_TransactionLineItemsSourceLocation_Row${idx}`"
                        />
                    </div>

                    <div class="w-full xl:w-48">
                        <Select
                            v-model="line.toLocationId"
                            :options="locationOptions"
                            label="Target Location"
                            placeholder="Select target location"
                            required
                            :object-id="`cmb_TransactionLineItemsTargetLocation_Row${idx}`"
                        />
                    </div>
                </template>

                <div
                    v-if="showDualWarehouse || isRelocation"
                    class="w-full xl:w-48"
                >
                    <Select
                        v-model="line.fromLocationId"
                        :options="
                            isRelocation ? locationOptions : fromLocationOptions
                        "
                        label="From Location"
                        placeholder="Source location"
                        required
                        :object-id="`cmb_TransactionLineItemsFromLocation_Row${idx}`"
                    />
                </div>

                <div
                    v-if="showDualWarehouse || isRelocation"
                    class="w-full xl:w-48"
                >
                    <Select
                        v-model="line.toLocationId"
                        :options="
                            isRelocation ? locationOptions : toLocationOptions
                        "
                        label="To Location"
                        placeholder="Destination location"
                        required
                        :object-id="`cmb_TransactionLineItemsToLocation_Row${idx}`"
                    />
                </div>

                <div class="w-full xl:w-48">
                    <template v-if="isRegister">
                        <p class="mb-1 text-xs font-medium text-text-secondary">
                            Product Qty
                        </p>
                        <div
                            v-if="line.productId"
                            class="flex flex-wrap items-center gap-2"
                        >
                            <span
                                class="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text"
                                :object-id="`chp_TransactionLineItemsBaseQty_Row${idx}`"
                            >
                                {{ baseQtyLabel(line) }}
                            </span>
                            <span
                                v-if="hasBreakdownUnit(line.productId)"
                                class="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text"
                                :object-id="`chp_TransactionLineItemsBreakdownQty_Row${idx}`"
                            >
                                {{ breakdownQtyLabel(line) }}
                            </span>
                        </div>
                        <p v-else class="text-xs text-text-secondary">
                            Select a product to set quantity.
                        </p>
                    </template>
                    <Input
                        v-else
                        :id="`qty-${idx}`"
                        v-model="line.qty"
                        label="Quantity"
                        type="number"
                        min="1"
                        required
                        :object-id="`nmf_TransactionLineItemsQty_Row${idx}`"
                    />
                </div>
                <div class="w-full xl:w-auto xl:ml-auto xl:self-end">
                    <Button
                        type="button"
                        variant="outline"
                        class="w-full xl:w-auto text-danger-600 border-danger-200 hover:bg-danger-50 px-3"
                        :object-id="`btn_TransactionLineItemsRemove_Row${idx}`"
                        @click="$emit('remove-line', idx)"
                    >
                        Remove
                    </Button>
                </div>
            </div>
            <p
                v-if="lines.length === 0"
                class="text-sm text-text-secondary text-center py-4"
            >
                No line items added yet. Click "Add Line" to begin.
            </p>
        </div>
        <div
            class="mt-auto px-6 py-3 border-t border-border flex justify-end gap-3"
        >
            <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="submitting"
                object-id="btn_TransactionLineItemsCancel"
                @click="$emit('back')"
                >Cancel</Button
            >
            <Button
                type="submit"
                variant="primary"
                size="sm"
                :disabled="submitting || lines.length === 0"
                object-id="btn_TransactionLineItemsSave"
            >
                {{ submitting ? "Saving..." : "Save Transaction" }}
            </Button>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import { convertUomQty } from "../utils/uomConversion";

interface ProductUomInfo {
    baseUomId: string;
    baseLabel: string;
    unitName?: string | null;
    conversionFactor?: number | null;
    breakdownUomId?: string | null;
}

const props = defineProps<{
    lines: Array<{
        productId: string;
        qty: string;
        locationId: string;
        fromLocationId: string;
        toLocationId: string;
        enteredUomId?: string;
        enteredQty?: string;
    }>;
    productOptions: Array<{ label: string; value: string }>;
    productAttributeSummaries: Record<string, string>;
    productUomInfo: Record<string, ProductUomInfo>;
    locationOptions: Array<{ label: string; value: string }>;
    fromLocationOptions: Array<{ label: string; value: string }>;
    toLocationOptions: Array<{ label: string; value: string }>;
    showSingleWarehouse: boolean;
    isRelocation: boolean;
    showDualWarehouse: boolean;
    showPutawayLocations: boolean;
    isRegister: boolean;
    submitting: boolean;
}>();

defineEmits(["add-line", "remove-line", "back"]);

const hasBreakdownUnit = (productId: string): boolean => {
    const info = props.productUomInfo[productId];
    return Boolean(info?.unitName && info?.conversionFactor);
};

const formatQtyNumber = (value: number): string => {
    if (!Number.isFinite(value)) return "0";
    return Number(value.toFixed(2)).toString();
};

const baseQtyLabel = (line: { productId: string; qty: string }): string => {
    const info = props.productUomInfo[line.productId];
    const label = info?.baseLabel ?? "Unit";
    return `${line.qty || "0"} ${label}`;
};

const breakdownQtyLabel = (line: {
    productId: string;
    qty: string;
}): string => {
    const info = props.productUomInfo[line.productId];
    if (!info?.conversionFactor || !info?.unitName) return "";
    const breakdownQty = convertUomQty(
        Number(line.qty) || 0,
        "base",
        info.conversionFactor,
    );
    return `${formatQtyNumber(breakdownQty)} ${info.unitName}`;
};
</script>
