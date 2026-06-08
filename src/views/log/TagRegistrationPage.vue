<template>
    <section class="space-y-6">
        <PageHeader
            title="Tag Registration"
            description="Capture new RFID tags."
            tagline="Log"
        />

        <FormRoot @submit="handleSubmit">
            <FormSection
                title="Tag Info"
                subtitle="Identitas tag"
                variant="card"
            >
                <FormGrid>
                    <FormField label="EPC" required :error="errors.epc">
                        <input
                            id="txt_TagRegistrationEpc"
                            v-model="formState.epc"
                            type="text"
                            placeholder="Enter EPC"
                            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                            data-testid="txt_TagRegistrationEpc"
                        />
                    </FormField>
                    <FormField
                        label="Tag Type"
                        required
                        :error="errors.tagType"
                    >
                        <select
                            id="cmb_TagRegistrationTagType"
                            v-model="formState.tagType"
                            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                            data-testid="cmb_TagRegistrationTagType"
                        >
                            <option value="" disabled>Select type</option>
                            <option
                                v-for="type in tagTypes"
                                :key="type"
                                :value="type"
                            >
                                {{ type }}
                            </option>
                        </select>
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection
                title="Item Info"
                subtitle="Detail item terkait"
                description="Gunakan informasi ini untuk track lokasi."
            >
                <FormGrid>
                    <FormField label="SKU" required :error="errors.sku">
                        <input
                            id="txt_TagRegistrationSku"
                            v-model="formState.sku"
                            type="text"
                            placeholder="Item SKU"
                            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                            data-testid="txt_TagRegistrationSku"
                        />
                    </FormField>
                    <FormField
                        label="Location"
                        :hint="'Optional storage location'"
                    >
                        <input
                            id="txt_TagRegistrationLocation"
                            v-model="formState.location"
                            type="text"
                            placeholder="Warehouse aisle"
                            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                            data-testid="txt_TagRegistrationLocation"
                        />
                    </FormField>
                    <FormField label="Notes" full>
                        <textarea
                            id="txa_TagRegistrationNotes"
                            v-model="formState.notes"
                            rows="3"
                            placeholder="Short memo"
                            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                            data-testid="txa_TagRegistrationNotes"
                        ></textarea>
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormActions>
                <Button
                    variant="ghost"
                    type="button"
                    object-id="btn_TagRegistrationReset"
                    @click="resetForm"
                    >Reset</Button
                >
                <Button
                    variant="primary"
                    type="submit"
                    object-id="btn_TagRegistrationSubmit"
                    >Submit</Button
                >
            </FormActions>
        </FormRoot>
    </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import Button from "@/components/atoms/Button.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import {
    FormRoot,
    FormSection,
    FormGrid,
    FormField,
    FormActions,
} from "@/components/ui/form";
import { useNotifier } from "@/composable/useNotifier";

const { notifySuccess } = useNotifier();

const formState = reactive({
    epc: "",
    tagType: "",
    sku: "",
    location: "",
    notes: "",
});

const errors = reactive({
    epc: "",
    tagType: "",
    sku: "",
});

const tagTypes = ["Asset", "Pallet", "Unit"];

const validate = () => {
    let isValid = true;
    errors.epc = formState.epc.trim() ? "" : "EPC diperlukan";
    errors.tagType = formState.tagType ? "" : "Pilih tipe tag";
    errors.sku = formState.sku.trim() ? "" : "SKU diperlukan";
    if (errors.epc || errors.tagType || errors.sku) {
        isValid = false;
    }
    return isValid;
};

const handleSubmit = () => {
    if (!validate()) return;
    notifySuccess("Tag berhasil didaftarkan");
    resetForm();
};

const resetForm = () => {
    formState.epc = "";
    formState.tagType = "";
    formState.sku = "";
    formState.location = "";
    formState.notes = "";
    errors.epc = "";
    errors.tagType = "";
    errors.sku = "";
};
</script>
