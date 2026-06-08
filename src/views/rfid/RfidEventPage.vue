<template>
    <section class="space-y-6">
        <PageHeader
            title="RFID Events"
            description="Log lifecycle events for EPC tags."
            tagline="RFID"
        />

        <Card class="space-y-4" object-id="wdg_RfidEventForm">
            <FormRoot @submit="submitEvent">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                    <TextField
                        name="epcCode"
                        label="EPC Code"
                        required
                        object-id="txt_RfidEventEpcCode"
                    />
                    <SelectField
                        name="eventType"
                        :options="eventTypeOptions"
                        label="Event Type"
                        placeholder="Select event"
                        required
                        object-id="cmb_RfidEventEventType"
                    />
                    <TextField
                        name="warehouseId"
                        label="Warehouse"
                        class="md:col-span-2"
                        object-id="txt_RfidEventWarehouse"
                    />
                    <TextField
                        name="locationId"
                        label="Location"
                        class="md:col-span-2"
                        object-id="txt_RfidEventLocation"
                    />
                    <TextField
                        name="documentRef"
                        label="Document Reference"
                        class="md:col-span-2"
                        object-id="txt_RfidEventDocumentRef"
                    />
                    <TextareaField
                        name="notes"
                        label="Notes"
                        :rows="2"
                        class="md:col-span-2"
                        object-id="txa_RfidEventNotes"
                    />
                </div>
                <div class="flex items-center gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        :loading="isSubmitting"
                        :disabled="isSubmitting"
                        object-id="btn_RfidEventSubmit"
                    >
                        Log Event
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        :disabled="isSubmitting"
                        object-id="btn_RfidEventReset"
                        @click="resetFormState"
                    >
                        Reset
                    </Button>
                </div>
                <p v-if="submitError" class="mt-4 text-xs text-rose-600">
                    {{ submitError }}
                </p>
            </FormRoot>
        </Card>
    </section>
</template>

<script setup lang="ts">
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import Button from "@/components/atoms/Button.vue";
import FormRoot from "@/components/ui/form/FormRoot.vue";
import TextField from "@/components/ui/fields/TextField.vue";
import SelectField from "@/components/ui/fields/SelectField.vue";
import TextareaField from "@/components/ui/fields/TextareaField.vue";
import { useRfidEvent } from "./composables/useRfidEvent";

const {
    eventTypeOptions,
    isSubmitting,
    submitError,
    resetFormState,
    submitEvent,
} = useRfidEvent();
</script>
