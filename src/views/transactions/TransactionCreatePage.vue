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
                <Card
                    class="md:col-span-1"
                    object-id="wdg_TransactionCreateDetails"
                >
                    <h3
                        class="text-base font-semibold text-gray-900 mb-4 border-b pb-3"
                    >
                        Document Details
                    </h3>
                    <div class="space-y-4">
                        <Input
                            id="docNumber"
                            v-model="form.docNumber"
                            label="Document Number"
                            placeholder="TRX-12345"
                            required
                            object-id="txt_TransactionCreateDocNumber"
                        />

                        <Input
                            v-if="!isOpname"
                            id="transactionDate"
                            v-model="form.transactionDate"
                            label="Transaction Date"
                            type="date"
                            required
                            object-id="dtp_TransactionCreateDate"
                        />

                        <Select
                            v-if="isOpname"
                            id="title"
                            v-model="form.title"
                            label="Opname Group / Profile"
                            :options="opnameProfileOptions"
                            placeholder="Select opname routine"
                            object-id="cmb_TransactionCreateOpnameTitle"
                            @update:model-value="form.period = ''"
                        />

                        <Select
                            v-if="
                                isOpname && form.title === 'Group (Per Quartal)'
                            "
                            id="period"
                            v-model="form.period"
                            label="Quarter Period"
                            :options="quartalOptions"
                            placeholder="Select quarter"
                            required
                            object-id="cmb_TransactionCreateOpnameQuartal"
                        />

                        <Select
                            v-if="
                                isOpname && form.title === 'Profile (Per Bulan)'
                            "
                            id="period"
                            v-model="form.period"
                            label="Month Period"
                            :options="monthOptions"
                            placeholder="Select month"
                            required
                            object-id="cmb_TransactionCreateOpnameMonth"
                        />

                        <Select
                            v-if="showSingleWarehouse"
                            v-model="form.warehouseId"
                            :options="warehouseOptions"
                            label="Warehouse"
                            placeholder="Select warehouse"
                            required
                            object-id="cmb_TransactionCreateWarehouse"
                        />

                        <template v-if="showDualWarehouse">
                            <Select
                                v-model="form.fromWarehouseId"
                                :options="warehouseOptions"
                                label="Source Warehouse"
                                placeholder="Select source warehouse"
                                required
                                object-id="cmb_TransactionCreateFromWarehouse"
                            />
                            <Select
                                v-model="form.toWarehouseId"
                                :options="warehouseOptions"
                                label="Destination Warehouse"
                                placeholder="Select destination warehouse"
                                required
                                object-id="cmb_TransactionCreateToWarehouse"
                            />
                        </template>

                        <Select
                            v-if="showPartnerField"
                            v-model="form.partnerId"
                            :options="partnerOptions"
                            :label="partnerLabel"
                            placeholder="Select partner"
                            :required="
                                transactionKey === 'inbound' ||
                                transactionKey === 'outbound'
                            "
                            object-id="cmb_TransactionCreatePartner"
                        />

                        <Input
                            id="notes"
                            v-model="form.notes"
                            label="Notes / Description"
                            placeholder="Optional notes"
                            object-id="txt_TransactionCreateNotes"
                        />
                    </div>
                </Card>

                <!-- Line Items Form (Hide for Opname) -->
                <TransactionLineItems
                    v-if="!isOpname"
                    :lines="form.lines"
                    :product-options="productOptions"
                    :location-options="locationOptions"
                    :from-location-options="fromLocationOptions"
                    :to-location-options="toLocationOptions"
                    :show-single-warehouse="showSingleWarehouse"
                    :is-relocation="isRelocation"
                    :show-dual-warehouse="showDualWarehouse"
                    :submitting="submitting"
                    @add-line="addLine"
                    @remove-line="removeLine"
                    @back="handleBack"
                />

                <!-- Opname Save Button -->
                <Card
                    v-else
                    class="md:col-span-2"
                    no-padding
                    object-id="wdg_TransactionCreateOpname"
                >
                    <div class="px-6 py-5 border-b border-gray-100">
                        <h3 class="text-base font-semibold text-gray-900">
                            Opname Creation
                        </h3>
                        <p class="text-sm text-gray-500 mt-2">
                            Creating a Stock Opname does not require line items
                            initially. Once created, you can start the counting
                            process and the system will automatically snapshot
                            the warehouse balances.
                        </p>
                    </div>
                    <div
                        class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            :disabled="submitting"
                            object-id="btn_TransactionCreateCancel"
                            @click="handleBack"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            :disabled="submitting"
                            object-id="btn_TransactionCreateOpnameSubmit"
                        >
                            {{ submitting ? "Creating..." : "Create Opname" }}
                        </Button>
                    </div>
                </Card>
            </div>
        </form>
    </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import TransactionLineItems from "./components/TransactionLineItems.vue";
import type { TransactionKey } from "@/services/transactions.service";
import { useTransactionCreate } from "./composables/useTransactionCreate";

const props = defineProps<{
    transactionKey: TransactionKey;
}>();

const {
    form,
    submitting,
    transactionTitle,
    showSingleWarehouse,
    showDualWarehouse,
    showPartnerField,
    isRelocation,
    isOpname,
    partnerLabel,
    warehouseOptions,
    partnerOptions,
    productOptions,
    locationOptions,
    fromLocationOptions,
    toLocationOptions,
    opnameProfileOptions,
    quartalOptions,
    monthOptions,
    addLine,
    removeLine,
    handleBack,
    loadOptions,
    handleSubmit,
} = useTransactionCreate(props.transactionKey);

onMounted(() => {
    loadOptions();
});
</script>
