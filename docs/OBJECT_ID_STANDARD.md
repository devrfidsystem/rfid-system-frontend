# Object ID Standard (Automation Testing)

Dokumen ini mendefinisikan standar penamaan dan implementasi Object ID (`id` dan `data-testid`) pada seluruh elemen antarmuka (UI) dalam aplikasi. Tujuannya adalah memastikan kestabilan *selector* untuk keperluan *Automated UI Testing* (Selenium, Cypress, Playwright, dll).

## 1. Aturan Dasar

*   **Identitas Ganda:** Setiap elemen yang interaktif wajib memiliki atribut `id` dan `data-testid` dengan nilai yang persis sama.
*   **Dilarang Random:** Jangan gunakan ID acak (UUID, Hash, Timestamp) atau nilai yang diterjemahkan secara *runtime* (i18n).
*   **Format Penamaan:** `{prefix}_{NamaElemenDalamPascalCase}`
    *   *Contoh:* `txt_NamaLengkap`, `btn_SimpanPerubahan`.

## 2. Standard Prefix

Gunakan prefix 3 huruf berikut berdasarkan jenis komponen:

| Elemen | Prefix | Contoh |
| :--- | :--- | :--- |
| Button | `btn_` | `btn_Login`, `btn_SubmitForm` |
| Checkbox | `chk_` | `chk_SyaratKetentuan` |
| Combo Box / Select | `cmb_` | `cmb_PilihGudang` |
| Date Picker | `dtp_` | `dtp_TanggalMulai` |
| Dialog / Modal / Drawer | `dab_` | `dab_KonfirmasiHapus` |
| File Upload | `fld_` | `fld_UploadDokumen` |
| Message Box / Toast | `msb_` | `msb_NotifikasiSukses` |
| Number Field | `nmf_` | `nmf_JumlahStok` |
| Radio Button | `rdb_` | `rdb_Pria`, `rdb_Wanita` |
| Table | `tbl_` | `tbl_DaftarKaryawan` |
| Text Area | `txa_` | `txa_CatatanTambahan` |
| Text Field / Input | `txt_` | `txt_EmailPengguna` |
| Tree Menu | `trm_` | `trm_StrukturOrganisasi` |
| Icon (Action) | `icn_` | `icn_TutupModal`, `icn_HapusBaris` |
| Image (Action) | `img_` | `img_BukaPreview` |
| Link Label | `lkl_` | `lkl_LupaPassword` |
| List Box | `lsb_` | `lsb_PilihSistem` |
| Picture Box | `pcb_` | `pcb_ProfilePicture` |
| Accordion | `acd_` | `acd_DetailPengiriman` |
| Breadcrumb | `bdb_` | `bdb_NavigasiAtas` |
| Context Menu | `ctm_` | `ctm_OpsiLanjutan` |
| Pagination | `pgn_` | `pgn_HalamanDaftarKaryawan` |
| Switch / Toggle | `swc_` | `swc_ModeGelap` |
| Widget / Card | `wdg_` | `wdg_RingkasanStok` |

## 3. Implementasi pada Reusable Component

Jika membuat/memodifikasi komponen reusable (*Atoms*, *Molecules*), komponen wajib menerima prop `objectId` dan meneruskannya ke root interaktif:

```vue
<template>
  <button
    :id="objectId"
    :data-testid="objectId"
    class="btn-style"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ objectId?: string }>();
</script>
```

> [!TIP]
> Di Vue 3, Anda bisa juga menggunakan fungsi *helper* `bindObjectId` dari `src/utils/objectId.ts`:
> `<button v-bind="bindObjectId(objectId)">`

## 4. Penamaan Elemen Berulang (Table/List)

Untuk tombol atau aksi di dalam tabel / iterasi data, tambahkan suffix berupa ID baris (Prioritas 1) atau Index baris (Prioritas 2).

```vue
<!-- Prioritas 1 (Gunakan ID dari data) -->
<button :id="`btn_HapusKaryawan_${employee.id}`" :data-testid="`btn_HapusKaryawan_${employee.id}`">Hapus</button>

<!-- Prioritas 2 (Gunakan Index jika ID tidak tersedia) -->
<button :id="`btn_HapusBaris_Row${index}`" :data-testid="`btn_HapusBaris_Row${index}`">Hapus</button>
```
