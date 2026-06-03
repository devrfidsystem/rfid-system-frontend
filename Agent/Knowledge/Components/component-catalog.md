# Component Catalog

Daftar komponen yang _Reusable_ pada aplikasi.
**RULE:** Gunakan component existing terlebih dahulu. Dilarang membuat duplicate component.

---

## Component Name: `<AppTable>`

- **Purpose**: Render array object menjadi grid HTML responsif.
- **Props**:
    - `columns` (Array interface kolom)
    - `data` (Array data dari API)
    - `loading` (Boolean state)
- **Events**:
    - `@sort`: Saat header kolom diklik.
    - `@action`: Saat tombol baris (edit/delete) diklik.
- **Example Usage**:
    ```vue
    <AppTable
        :columns="cols"
        :data="rows"
        :loading="isLoading"
        @action="handleAction"
    />
    ```
- **Pages Using It**: Hampir seluruh halaman List (`RolesPage.vue`, `MasterEntityPage.vue`, dsb).

---

## Component Name: `<FormRoot>`

- **Purpose**: Pembungkus validasi VeeValidate dan ekstrak event form HTML.
- **Props**:
    - `schema` (Zod Object schema)
    - `initialValues` (Object data default)
- **Events**:
    - `@submit`: Emits payload ketika form lolos validasi.
- **Example Usage**:
    ```vue
    <FormRoot :schema="mySchema" @submit="onSubmit">
      <TextField name="email" label="Email" />
      <Button type="submit">Kirim</Button>
    </FormRoot>
    ```
- **Pages Using It**: Semua form (`RfidAssignmentPage.vue`, Drawer component, Dialog form).

---

## Component Name: `<AppDrawer>`

- **Purpose**: Panel laci geser dari pinggir untuk edit/create form.
- **Props**:
    - `modelValue` (Boolean, alias `v-model:isOpen` statenya)
    - `title` (String)
- **Events**:
    - `@update:modelValue`: Dipicu saat overlay di luar diklik.
- **Example Usage**:
    ```vue
    <AppDrawer v-model="isDrawerOpen" title="Tambah Gudang">
      <!-- Konten form -->
    </AppDrawer>
    ```
- **Pages Using It**: `MasterEntityPage.vue`.

---

## Component Name: `<TextField>` / `<SelectField>`

- **Purpose**: Input atomik yang sudah terhubung dengan state VeeValidate secara otomatis melalui properti `name`.
- **Props**:
    - `name` (String: Field key)
    - `label` (String)
    - `options` (Array of objects, khusus untuk `<SelectField>`)
- **Events**:
    - Standar input event.
- **Example Usage**:
    ```vue
    <SelectField name="warehouseId" label="Pilih Gudang" :options="whOptions" />
    ```
- **Pages Using It**: Tersebar pada modul-modul form.
