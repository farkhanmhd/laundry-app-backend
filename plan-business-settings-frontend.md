# Rencana Implementasi: Halaman Business Settings (Frontend)

## Ringkasan

Buat halaman admin untuk mengelola pengaturan bisnis (alamat toko, titik koordinat, jarak maksimum pengiriman). Data berupa **singleton** — hanya ada satu baris di database.

---

## API Reference

Semua endpoint ada di prefix `/business-settings`.

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/business-settings` | `auth: true` | Ambil settings |
| `PUT` | `/business-settings` | `isSuperAdmin: true` | Create/overwrite semua field |
| `PATCH` | `/business-settings` | `isSuperAdmin: true` | Partial update |

**Response shape (GET):**

```json
{
  "status": "success",
  "message": "Business settings retrieved",
  "messageKey": "businessSettings.retrieved",
  "data": {
    "id": "uuid",
    "address": "Jl. Contoh No. 123",
    "latitude": "-6.2087634",
    "longitude": "106.845599",
    "maxDistanceKm": "10.00",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

> **Catatan:** `latitude`, `longitude`, dan `maxDistanceKm` dikirim sebagai **string** (sesuai tipe numeric di Drizzle).

**Request body (PUT/PATCH):**

```json
{
  "address": "Jl. Contoh No. 123",
  "latitude": "-6.2087634",
  "longitude": "106.845599",
  "maxDistanceKm": "10.00"
}
```

> `PUT` mengecek existing — jika sudah ada row, update row tersebut; jika belum ada, insert baru. `PATCH` melakukan hal yang sama (upsert). Untuk frontend cukup panggil salah satu, misal pakai `PATCH` saja untuk update.

---

## Task List

### 1. Buat Halaman & Route

- Tambahkan menu/page "Business Settings" di sidebar admin (akses terbatas superadmin)
- Path: `/admin/business-settings` atau `/superadmin/business-settings` (ikuti pola routing yang sudah ada)
- Tampilkan form kosong saat pertama kali (belum pernah diisi) atau form terisi saat data sudah ada

### 2. API Service Layer

Buat service function di layer API (sesuai pola yang sudah ada, misal `src/services/business-settings.ts`):

```typescript
export const businessSettingsApi = {
  get: () => api.get("/business-settings"),
  upsert: (data: BusinessSettingsInput) => api.put("/business-settings", data),
  patch: (data: Partial<BusinessSettingsInput>) => api.patch("/business-settings", data),
};
```

### 3. Form dengan React Hook Form

Buat form dengan **React Hook Form** untuk field berikut:

| Field | Tipe | Validasi |
|-------|------|----------|
| `address` | `textarea` / `input text` | Required |
| `latitude` | `input text` (disabled, diisi otomatis oleh Map) | Required |
| `longitude` | `input text` (disabled, diisi otomatis oleh Map) | Required |
| `maxDistanceKm` | `input number` | Required, min 0 |

**Pattern form (sesuai codebase):**

- Gunakan `useForm` dengan mode `onSubmit`
- Tampilkan loading skeleton/indicator saat fetching data
- Tampilkan error state jika GET gagal (404 = belum pernah dibuat, bukan error — tampilkan form kosong)
- Submit via `PATCH` (untuk update) atau `PUT` (untuk create). Cukup pakai satu tombol "Simpan" yang panggil `PUT` (upsert).
- Validasi: `address` required, `latitude` & `longitude` required (dari Map), `maxDistanceKm` required & positif

### 4. Gunakan Existing Map Component untuk latitude & longitude

Tempatkan Map component yang sudah ada di sebelah/lokasi kolom latitude & longitude.

- Map sudah ada di codebase — cari komponen Map yang menerima `latitude`, `longitude`, `onChange` (atau callback serupa)
- Saat pin/marker dipindah di Map, update nilai `latitude` dan `longitude` di form state
- Field `latitude` dan `longitude` di form sebaiknya **read-only/disabled** (hanya bisa diubah lewat Map)
- Saat form load (GET berhasil), set posisi marker Map sesuai data latitude/longitude yang ada

**Alur integrasi Map dengan React Hook Form:**

```tsx
const { register, setValue, watch, handleSubmit } = useForm({
  defaultValues: { address: "", latitude: "", longitude: "", maxDistanceKm: "" },
});

const onMapChange = (lat: number, lng: number) => {
  setValue("latitude", lat.toString());
  setValue("longitude", lng.toString());
};

// Cari pattern yang sudah dipakai di codebase untuk Map component
// dan gunakan yang sama.
```

### 5. Loading, Error, Success State

- **Loading:** Tampilkan form skeleton atau spinner saat GET data
- **Error GET:** Kalau 404 (belum ada data), tampilkan form kosong. Kalau error lain, tampilkan alert/notifikasi error.
- **Submit sukses:** Tampilkan toast "Pengaturan berhasil disimpan"
- **Submit gagal:** Tampilkan toast error sesuai pesan dari API

### 6. Proteksi Akses

Halaman ini hanya bisa diakses oleh **superadmin**. Gunakan mekanisme yang sudah ada (guard, redirect, atau conditional rendering). Kalau user non-superadmin mencoba akses, sebaiknya:

- Sembunyikan menu dari sidebar
- Redirect ke halaman lain atau tampilkan 403

---

## Catatan Tambahan

- Data `createdAt` & `updatedAt` dikelola otomatis oleh backend — jangan dikirim dari form
- Karena ini singleton, tidak perlu table/list view — cukup satu halaman form saja
- Jika map component membutuhkan koordinat awal default, gunakan koordinat toko/pusat kota (misal untuk Jakarta: `-6.2087634`, `106.845599`)
- Ikuti pola yang sudah ada di codebase untuk toast notifikasi, form styling, dan komponen Map
- Buat Form Reusable
- Untuk data fetching gunakan tanstack query beserta loading state dan error handling dengan retry mechanism
