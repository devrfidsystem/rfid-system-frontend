<template>
    <Card class="md:col-span-2" no-padding object-id="wdg_TransactionLineItems">
        <div
            class="px-6 py-5 border-b border-gray-100 flex justify-between items-center"
        >
            <h3 class="text-base font-semibold text-gray-900">Line Items</h3>
            <Button
                type="button"
                size="sm"
                variant="outline"
                object-id="btn_TransactionLineItemsAdd"
                @click="$emit('add-line')"
                >Add Line</Button
            >
        </div>
        <div class="overflow-x-auto p-6 space-y-4">
            <div
                v-for="(line, idx) in lines"
                :key="idx"
                class="flex flex-col xl:flex-row gap-4 xl:items-end border-b border-gray-100 xl:border-none pb-4 xl:pb-0 last:border-0"
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
                </div>

                <div
                    v-if="showSingleWarehouse && !isRelocation"
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

                <div class="w-full xl:w-32">
                    <Input
                        :id="`qty-${idx}`"
                        v-model="line.qty"
                        label="Quantity"
                        type="number"
                        min="1"
                        required
                        :object-id="`nmf_TransactionLineItemsQty_Row${idx}`"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    class="text-rose-600 border-rose-200 hover:bg-rose-50 px-3"
                    :object-id="`btn_TransactionLineItemsRemove_Row${idx}`"
                    @click="$emit('remove-line', idx)"
                >
                    Remove
                </Button>
            </div>
            <p
                v-if="lines.length === 0"
                class="text-sm text-gray-500 text-center py-4"
            >
                No line items added yet. Click "Add Line" to begin.
            </p>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <Button
                type="button"
                variant="outline"
                :disabled="submitting"
                object-id="btn_TransactionLineItemsCancel"
                @click="$emit('back')"
                >Cancel</Button
            >
            <Button
                type="submit"
                variant="primary"
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

defineProps<{
    lines: Array<{
        productId: string;
        qty: string;
        locationId: string;
        fromLocationId: string;
        toLocationId: string;
    }>;
    productOptions: Array<{ label: string; value: string }>;
    locationOptions: Array<{ label: string; value: string }>;
    fromLocationOptions: Array<{ label: string; value: string }>;
    toLocationOptions: Array<{ label: string; value: string }>;
    showSingleWarehouse: boolean;
    isRelocation: boolean;
    showDualWarehouse: boolean;
    submitting: boolean;
}>();

defineEmits(["add-line", "remove-line", "back"]);
</script>
