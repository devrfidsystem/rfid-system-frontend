# Form Layout System

## Struktur Komponen
- `FormRoot`: Pembungkus `<form>` yang mengurus spacing antar section dan emit submit. Jangan bungkus dengan card lagi.
- `FormSection`: Section dengan heading + subtitle/deskripsi. Gunakan `variant card` bila perlu tampilan bordered.
- `FormGrid`: Grid responsive 1 kolom di mobile, 2 kolom di desktop. `col-span-2` untuk field full-width.
- `FormField`: Label + hint + error di bawah input, mendukung mode `stacked`/`inline` dan `full` (md:col-span-2).
- `FormActions`: Bar tombol, bisa sticky footer dengan prop `sticky`.

## Contoh Penggunaan (Tag Registration)
```vue
<FormRoot @submit="handleSubmit">
  <FormSection title="Tag Info">
    <FormGrid>
      <FormField label="EPC" required :error="errors.epc">
        <input v-model="formState.epc" />
      </FormField>
      <FormField label="Tag Type" required :error="errors.tagType">
        <select v-model="formState.tagType">...</select>
      </FormField>
    </FormGrid>
  </FormSection>
  <FormSection title="Item Info">
    <FormGrid>
      <FormField label="SKU" required :error="errors.sku">
        <input v-model="formState.sku" />
      </FormField>
      <FormField label="Notes" full>
        <textarea v-model="formState.notes" />
      </FormField>
    </FormGrid>
  </FormSection>
  <FormActions>
    <Button type="button" variant="primary" @click="handleSubmit">Submit</Button>
  </FormActions>
</FormRoot>
```

## Pedoman UX
- Letakkan pesan error tepat di bawah field (`FormField` sudah menangani ini).
- Hindari toast untuk validasi error; toast hanya dipakai setelah submit berhasil.
- Tombol submit harus disabled atau menolak submit saat `validate` gagal.

## Grid Behavior
- Default grid 2 kolom di desktop, 1 kolom di mobile.
- Gunakan `full` untuk field yang perlu menempati satu baris penuh (`md:col-span-2`).
- Hindari nested card; gunakan `FormSection` dengan variant card bila perlu border/bleeding.

## Kapan pakai FormSection variant "card" vs "plain"
- `card`: saat bagian punya boundary visual (contoh: tag info vs logistic info).
- `plain`: saat hanya butuh grup tanpa border khusus, agar tetap rapi di dalam panel.
```
