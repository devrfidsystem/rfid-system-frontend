<template>
  <section class="space-y-6">
    <PageHeader title="Tag Registration" description="Capture new RFID tags." tagline="Log" :icon="Tags" />

    <FormRoot @submit="onSubmit">
      <FormSection title="Tag Info" subtitle="Identitas tag" variant="card">
        <FormGrid>
          <TextField
            name="epc"
            label="EPC"
            required
            fieldId="epc"
            placeholder="Enter EPC"
          />
          <SelectField
            name="tagType"
            label="Tag Type"
            required
            fieldId="tagType"
            placeholder="Select type"
            :options="tagTypeOptions"
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Item Info" subtitle="Detail item terkait" description="Gunakan informasi ini untuk track lokasi.">
        <FormGrid>
          <TextField
            name="sku"
            label="SKU"
            required
            fieldId="sku"
            placeholder="Item SKU"
          />
          <TextField
            name="location"
            label="Location"
            fieldId="location"
            hint="Optional storage location"
            placeholder="Warehouse aisle"
          />
          <TextareaField
            name="notes"
            label="Notes"
            full
            fieldId="notes"
            placeholder="Short memo"
          />
        </FormGrid>
      </FormSection>

      <FormActions>
        <Button variant="outline" type="button" @click="resetForm()">Reset</Button>
        <Button type="submit" :loading="isSubmitting" :disabled="isSubmitting || !meta.valid">Simpan</Button>
      </FormActions>
    </FormRoot>
  </section>
</template>

<script setup lang="ts">
import { z } from 'zod';
import Button from '@/app/ui/Button.vue';
import PageHeader from '@/app/ui/PageHeader.vue';
import { Tags } from 'lucide-vue-next';
import { FormRoot, FormSection, FormGrid, FormActions } from '@/shared/components/form';
import { SelectField, TextField, TextareaField } from '@/shared/components/fields';
import { useZodForm } from '@/shared/composables/useZodForm';
import { useNotifier } from '@/composables/useNotifier';

const { notifySuccess } = useNotifier();

const tagTypes = ['Asset', 'Pallet', 'Unit'];
const tagTypeOptions = tagTypes.map((type) => ({ label: type, value: type }));

const schema = z.object({
  epc: z.string().nonempty('EPC diperlukan'),
  tagType: z.string().nonempty('Pilih tipe tag'),
  sku: z.string().nonempty('SKU diperlukan'),
  location: z.string().optional(),
  notes: z.string().optional()
});

const initialValues: z.infer<typeof schema> = {
  epc: '',
  tagType: '',
  sku: '',
  location: '',
  notes: ''
};

const { handleSubmit, meta, resetForm, isSubmitting } = useZodForm(schema, initialValues);
const onSubmit = handleSubmit(() => {
  notifySuccess('Tag berhasil didaftarkan');
  resetForm();
});
</script>
