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
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                :object-id="`btn_TransactionLineItemsEditQty_Row${idx}`"
                                @click="openEditQty(idx)"
                            >
                                Edit Qty
                            </Button>
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
        <Drawer
            :model-value="editQtyLineIndex !== null"
            title="Edit Quantity"
            side="right"
            width="sm"
            object-id="drw_TransactionLineItemsEditQty"
            @update:model-value="(open) => !open && closeEditQty()"
        >
            <div v-if="editQtyLineIndex !== null" class="space-y-4">
                <Input
                    id="editQtyBase"
                    :model-value="editQtyBaseInput"
                    :label="`Quantity (${editQtyBaseLabel})`"
                    type="number"
                    min="0"
                    object-id="nmf_TransactionLineItemsEditQtyBase"
                    @update:model-value="onEditBaseInput"
                />
                <Input
                    v-if="editQtyHasBreakdown"
                    id="editQtyBreakdown"
                    :model-value="editQtyBreakdownInput"
                    :label="`Quantity (${editQtyUnitName})`"
                    type="number"
                    min="0"
                    object-id="nmf_TransactionLineItemsEditQtyBreakdown"
                    @update:model-value="onEditBreakdownInput"
                />
            </div>
            <template #footer>
                <Button
                    type="button"
                    variant="primary"
                    class="w-full justify-center"
                    object-id="btn_TransactionLineItemsEditQtySubmit"
                    @click="submitEditQty"
                >
                    Submit
                </Button>
            </template>
        </Drawer>
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
import { computed, ref } from "vue";
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import Drawer from "@/components/organisms/Drawer.vue";
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

const editQtyLineIndex = ref<number | null>(null);
const editQtyBaseInput = ref("");
const editQtyBreakdownInput = ref("");
const editQtyLastTier = ref<"base" | "breakdown">("base");

const editQtyProductInfo = computed<ProductUomInfo | null>(() => {
    if (editQtyLineIndex.value === null) return null;
    const line = props.lines[editQtyLineIndex.value];
    return props.productUomInfo[line.productId] ?? null;
});

const editQtyHasBreakdown = computed(() =>
    Boolean(
        editQtyProductInfo.value?.unitName &&
        editQtyProductInfo.value?.conversionFactor,
    ),
);

const editQtyConversionFactor = computed(
    () => editQtyProductInfo.value?.conversionFactor ?? 0,
);

const editQtyBaseLabel = computed(
    () => editQtyProductInfo.value?.baseLabel ?? "Unit",
);

const editQtyUnitName = computed(
    () => editQtyProductInfo.value?.unitName ?? "",
);

const openEditQty = (idx: number) => {
    editQtyLineIndex.value = idx;
    const line = props.lines[idx];
    editQtyBaseInput.value = line.qty || "0";
    editQtyLastTier.value = "base";

    const factor = props.productUomInfo[line.productId]?.conversionFactor;
    if (factor) {
        const baseValue = Number(line.qty) || 0;
        editQtyBreakdownInput.value = formatQtyNumber(
            convertUomQty(baseValue, "base", factor),
        );
    } else {
        editQtyBreakdownInput.value = "";
    }
};

const closeEditQty = () => {
    editQtyLineIndex.value = null;
};

const onEditBaseInput = (value: string) => {
    editQtyBaseInput.value = value;
    editQtyLastTier.value = "base";
    const factor = editQtyConversionFactor.value;
    if (!factor) return;
    const n = Number(value);
    editQtyBreakdownInput.value = Number.isFinite(n)
        ? formatQtyNumber(convertUomQty(n, "base", factor))
        : "";
};

const onEditBreakdownInput = (value: string) => {
    editQtyBreakdownInput.value = value;
    editQtyLastTier.value = "breakdown";
    const factor = editQtyConversionFactor.value;
    if (!factor) return;
    const n = Number(value);
    editQtyBaseInput.value = Number.isFinite(n)
        ? formatQtyNumber(convertUomQty(n, "breakdown", factor))
        : "";
};

const submitEditQty = () => {
    if (editQtyLineIndex.value === null) return;
    const line = props.lines[editQtyLineIndex.value];
    const info = editQtyProductInfo.value;

    line.qty = editQtyBaseInput.value || "0";

    if (editQtyLastTier.value === "breakdown" && editQtyHasBreakdown.value) {
        line.enteredUomId = info?.breakdownUomId ?? "breakdown";
        line.enteredQty = editQtyBreakdownInput.value || "0";
    } else {
        line.enteredUomId = info?.baseUomId ?? "";
        line.enteredQty = editQtyBaseInput.value || "0";
    }

    closeEditQty();
};
</script>
