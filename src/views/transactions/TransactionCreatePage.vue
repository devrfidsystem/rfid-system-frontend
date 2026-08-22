<template>
    <section class="space-y-6">
        <PageHeader
            :title="
                isEditMode
                    ? `Edit ${transactionTitle}`
                    : `New ${transactionTitle}`
            "
            :description="
                isEditMode
                    ? `Update draft ${transactionKey} details`
                    : isRegister
                      ? 'Create a new register task'
                      : isPutaway
                        ? 'Create a new putaway task'
                        : isOutbound
                          ? 'Create a new outbound assignment with an assigned user and deadline'
                          : transactionKey === 'inbound'
                            ? 'Create a new inbound receipt document'
                            : `Create a new ${transactionKey} transaction`
            "
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
                    <div class="mb-4 border-b border-border pb-3">
                        <ToolbarTitle title="Document Details" />
                    </div>
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
                            v-if="!isOpname && !isRegister"
                            id="transactionDate"
                            v-model="form.transactionDate"
                            label="Transaction Date"
                            type="date"
                            required
                            object-id="dtp_TransactionCreateDate"
                        />

                        <Input
                            v-if="isRegister"
                            id="transactionDate"
                            v-model="form.transactionDate"
                            label="Date Issue"
                            type="date"
                            required
                            object-id="dtp_TransactionCreateDate"
                        />

                        <Select
                            v-if="isRegister"
                            id="registeredById"
                            v-model="form.registeredById"
                            label="User"
                            :options="userOptions"
                            placeholder="Select user"
                            required
                            object-id="cmb_TransactionCreateRegisteredBy"
                        />

                        <Select
                            v-if="isRegister"
                            v-model="form.warehouseId"
                            :options="warehouseOptions"
                            label="Warehouse"
                            placeholder="Select warehouse"
                            required
                            object-id="cmb_TransactionCreateRegisterWarehouse"
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

                        <Select
                            v-if="isOutbound"
                            v-model="form.assignedById"
                            :options="userOptions"
                            label="Assigned User"
                            placeholder="Select assigned user"
                            required
                            object-id="cmb_TransactionCreateAssignedBy"
                        />

                        <Input
                            v-if="isOutbound"
                            id="deadlineAt"
                            v-model="form.deadlineAt"
                            label="Deadline"
                            type="date"
                            required
                            object-id="dtp_TransactionCreateDeadline"
                        />

                        <Input
                            id="notes"
                            v-model="form.notes"
                            label="Notes / Description"
                            placeholder="Optional notes"
                            object-id="txt_TransactionCreateNotes"
                        />

                        <template v-if="isPutaway">
                            <Input
                                id="referenceType"
                                v-model="form.referenceType"
                                label="Reference Type"
                                placeholder="Inbound, GRN, ASN, etc."
                                object-id="txt_TransactionCreateReferenceType"
                            />
                            <Input
                                id="referenceId"
                                v-model="form.referenceId"
                                label="Reference Number / ID"
                                placeholder="Optional source document"
                                object-id="txt_TransactionCreateReferenceId"
                            />
                        </template>
                    </div>
                </Card>

                <!-- Line Items Form (Hide for Opname only) -->
                <TransactionLineItems
                    v-if="!isOpname"
                    :lines="form.lines"
                    :product-options="productOptions"
                    :product-attribute-summaries="productAttributeSummaries"
                    :product-uom-info="productUomInfo"
                    :location-options="locationOptions"
                    :from-location-options="fromLocationOptions"
                    :to-location-options="toLocationOptions"
                    :show-single-warehouse="showSingleWarehouse && !isRegister"
                    :is-relocation="isRelocation"
                    :show-dual-warehouse="showDualWarehouse"
                    :show-putaway-locations="showPutawayLocations"
                    :is-register="isRegister"
                    :submitting="submitting"
                    @add-line="addLine"
                    @remove-line="removeLine"
                    @search-products="searchProducts"
                    @back="handleBack"
                />

                <!-- Opname Save Button -->
                <Card
                    v-else-if="isOpname"
                    class="md:col-span-2"
                    no-padding
                    object-id="wdg_TransactionCreateOpname"
                >
                    <div class="px-6 py-5 border-b border-border">
                        <ToolbarTitle
                            title="Opname Creation"
                            description="Creating a Stock Opname does not require line items initially. Once created, you can start the counting process and the system will automatically snapshot the warehouse balances."
                        />
                    </div>
                    <div
                        class="px-6 py-3 border-t border-border flex justify-end gap-3"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            :disabled="submitting"
                            object-id="btn_TransactionCreateCancel"
                            @click="handleBack"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
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
import ToolbarTitle from "@/components/molecules/ToolbarTitle.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import TransactionLineItems from "./components/TransactionLineItems.vue";
import type { TransactionKey } from "@/services/transactions.service";
import { useTransactionCreate } from "./composables/useTransactionCreate";

const props = defineProps<{
    transactionKey: TransactionKey;
    id?: string;
}>();

const {
    form,
    submitting,
    transactionTitle,
    showSingleWarehouse,
    showDualWarehouse,
    showPutawayLocations,
    showPartnerField,
    isRelocation,
    isOpname,
    isRegister,
    isOutbound,
    isPutaway,
    isEditMode,
    partnerLabel,
    warehouseOptions,
    partnerOptions,
    productOptions,
    productAttributeSummaries,
    productUomInfo,
    userOptions,
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
    loadExistingTransaction,
    searchProducts,
    handleSubmit,
} = useTransactionCreate(props.transactionKey, props.id);

onMounted(async () => {
    await loadOptions();
    await loadExistingTransaction();
});
</script>
