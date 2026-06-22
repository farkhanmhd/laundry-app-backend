# Rencana Implementasi: Sistem Kapasitas Berat (Rentang Berat) untuk Pemesanan Customer

## Konteks

Customer wajib menyatakan berat cucian saat melakukan permintaan jemput (request pickup), supaya sistem bisa menyarankan/menentukan jumlah unit minimum yang dibutuhkan untuk item yang kapasitasnya terbatas oleh berat (misal plastik 7kg/pcs, layanan cuci 5kg/unit).

Berat yang diinput bebas (angka kg) berisiko meleset dari berat aktual saat ditimbang ulang di toko, dan staf tidak diperbolehkan mengedit kuantitas maupun berat pada order yang sudah dibuat.

Solusi: customer **wajib memilih kategori berat (range)**, dan **boleh (opsional) input angka berat spesifik** yang, kalau diisi, harus berada dalam rentang kategori yang dipilih (mirip pola Gojek/Gosend untuk kategori berat paket — range wajib, angka custom opsional).

Kalau angka yang diinput melebihi rentang kategori yang dipilih, request pickup ditolak total — customer harus pilih kategori yang sesuai dulu atau kosongkan angka custom-nya.

**Kuantitas untuk item kapasitas-bound punya batas MINIMUM, bukan nilai yang dikunci mati.**

Minimum dihitung dari batas atas range:

```ts
Math.ceil(range.maxWeight / item.maxWeight)
```

Customer boleh meminta kuantitas lebih dari minimum itu (misal sengaja ambil 3 plastik padahal minimum cuma 2, untuk jaga-jaga), tapi tidak boleh kurang dari minimum.

Kalau customer kirim angka di bawah minimum, request ditolak.

Kalau customer tidak mengisi kuantitas sama sekali untuk item jenis ini, sistem otomatis isi dengan nilai minimum.

---

## Daftar Kolom & Tabel Baru (Ringkasan Cepat)

| Tabel | Kolom Baru | Tipe | Keterangan |
|--------|------------|------|------------|
| `services` | `max_weight` | numeric, nullable | kapasitas kg per unit layanan |
| `services` | `is_customer_orderable` | boolean, not null, default `false` | tampil/tidak di app customer |
| `inventories` | `max_weight` | numeric, nullable | kapasitas kg per pcs/unit barang |
| `inventories` | `is_customer_orderable` | boolean, not null, default `false` | tampil/tidak di app customer |
| `bundlings` | `max_weight` | numeric, nullable | kapasitas kg per paket |
| `bundlings` | `is_customer_orderable` | boolean, not null, default `false` | tampil/tidak di app customer |
| `orders` | `weight` | numeric, nullable | berat custom opsional dari customer |
| `orders` | `weight_range_id` | integer, nullable | FK → `weight_ranges.id` |

### Tabel Baru: `weight_ranges`

| Kolom | Tipe | Keterangan |
|--------|------|------------|
| `id` | serial, PK | auto-increment integer |
| `label` | varchar(50), not null | contoh: `"0 - 5 kg"` |
| `min_weight` | numeric, not null | batas bawah rentang |
| `max_weight` | numeric, not null | batas atas rentang |
| `is_active` | boolean, not null, default `true` | range nonaktif tidak muncul di app |
| `created_at` | timestamp, default now | waktu dibuat |

### Catatan

- `max_weight` nullable karena tidak semua item kapasitas-bound.
- `orders.weight_range_id` nullable di skema, tetapi wajib melalui validasi API customer pickup.
- `orders.weight` bersifat opsional.
- Order dari POS tidak menggunakan aturan range maupun minimum quantity.

---

## Skema Drizzle

### `src/db/schema/weight-ranges.ts`

```ts
import {
  boolean,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { orders } from "./orders";

export const weightRanges = pgTable("weight_ranges", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  minWeight: numeric("min_weight", {
    precision: 6,
    scale: 2,
  }).notNull(),
  maxWeight: numeric("max_weight", {
    precision: 6,
    scale: 2,
  }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", {
    mode: "string",
  }).defaultNow().notNull(),
});

export const weightRangesRelations = relations(
  weightRanges,
  ({ many }) => ({
    orders: many(orders),
  })
);
```

### Tambahan pada `services.ts`, `inventories.ts`, `bundlings.ts`

```ts
maxWeight: numeric("max_weight", {
  precision: 6,
  scale: 2,
}),
isCustomerOrderable: boolean("is_customer_orderable")
  .default(false)
  .notNull(),
```

### Tambahan pada `orders.ts`

```ts
weight: numeric("weight", {
  precision: 6,
  scale: 2,
}),
weightRangeId: integer("weight_range_id")
  .references(() => weightRanges.id),
```

### Migrasi

```bash
drizzle:generate
drizzle:migrate
```

---

## Backend

### 1. Modul Baru: `weight-ranges`

```text
GET    /weight-ranges
POST   /weight-ranges
PATCH  /weight-ranges/:id
```

#### Aturan

- GET hanya mengembalikan range aktif.
- Urut berdasarkan `minWeight ASC`.
- POST/PATCH wajib validasi overlap.
- Tidak ada hard delete.
- Nonaktifkan dengan `isActive = false`.
- Param `id` menggunakan integer (`t.Numeric()`).

---

### 2. Update `getPricesQuery`

Tambahkan:

```ts
maxWeight
isCustomerOrderable
```

ke kolom yang di-select.

---

### 3. Helper Baru: Validasi Kuantitas Minimum

```ts
function enforceMinimumQuantity(
  items: OrderItem[],
  itemPrices: (ItemPrice & {
    maxWeight: number | null;
  })[],
  effectiveWeight: number
): OrderItem[] {
  return items.map((item) => {
    const targetId =
      item.inventoryId ||
      item.serviceId ||
      item.bundlingId;

    const price = itemPrices.find(
      (p) => p.id === targetId
    );

    if (!price?.maxWeight) {
      return item;
    }

    const minQty = Math.ceil(
      effectiveWeight / price.maxWeight
    );

    const requestedQty =
      item.quantity ?? minQty;

    if (requestedQty < minQty) {
      throw new InternalError(
        `Kuantitas "${price.name}" minimal ${minQty} unit untuk kategori berat ini, diminta ${requestedQty}.`
      );
    }

    return {
      ...item,
      quantity: requestedQty,
    };
  });
}
```

#### Perilaku

- Quantity kosong → otomatis minimum.
- Quantity = minimum → diterima.
- Quantity > minimum → diterima.
- Quantity < minimum → ditolak.

Dipanggil sebelum `_processOrderItems()`.

---

### 4. Update Endpoint Request Pickup

#### Schema

```ts
const pickupOrderItemSchema = t.Composite([
  t.Omit(orderItemSchema, ["quantity"]),
  t.Object({
    quantity: t.Optional(t.Integer()),
  }),
]);

const requestPickupSchema = t.Object({
  items: t.Array(pickupOrderItemSchema),
  addressId: t.String(),
  points: t.Optional(
    t.Nullable(t.Number())
  ),
  requestTime: t.String(),
  weightRangeId: t.Integer({
    error: "Kategori berat wajib dipilih",
  }),
  weight: t.Optional(t.Number()),
});
```

#### Alur Validasi

1. Ambil range berdasarkan `weightRangeId`.
2. Validasi `isActive`.
3. Jika `weight` diisi:
   - harus berada dalam rentang.
4. Gunakan:

```ts
effectiveWeight = range.maxWeight;
```

5. Validasi item customer:
   - `isCustomerOrderable === true`
6. Untuk item non kapasitas-bound:
   - quantity wajib diisi.
7. Jalankan:

```ts
enforceMinimumQuantity(...)
```

8. Simpan:

```ts
weight: body.weight ?? null
weightRangeId: range.id
```

---

### 5. Filter Katalog Customer

Tambahkan filter:

```sql
WHERE is_customer_orderable = true
```

pada query:

- Services
- Inventories
- Bundlings

---

## Frontend

### Customer App

1. Customer wajib memilih kategori berat.
2. Tombol submit disabled sebelum kategori dipilih.
3. Input berat custom opsional.
4. Validasi rentang langsung di frontend.

### Item Kapasitas-Bound

- Quantity prefilled dengan minimum.
- Quantity tetap bisa ditambah.
- Tidak bisa kurang dari minimum.

### Item Non Kapasitas-Bound

- Quantity wajib diisi customer.
- Tidak ada auto-fill.

### Admin

CRUD Weight Range:

- List
- Tambah
- Edit
- Nonaktifkan

Validasi overlap dilakukan di UI dan backend.

### Form Service / Inventory / Bundling

Tambahkan:

- `Max Weight (kg)`
- `Tampilkan untuk Customer`

---

## Risiko Residual (Bab 4.2)

Mengizinkan quantity lebih besar dari minimum tidak menimbulkan kerugian karena customer tetap membayar unit tambahan tersebut.

Risiko yang masih ada:

- Berat aktual dapat melebihi rentang yang dipilih customer.
- Sistem tidak mengubah:
  - `weight`
  - `weightRangeId`
  - `quantity`

setelah order dibuat.

Penanganan dilakukan secara operasional di luar sistem, misalnya:

- Order tambahan terpisah.
- Ditoleransi sebagai risiko bisnis.

---

## Skenario Pengujian Black-box (Bab 4.1.3)

| Skenario | Hasil yang Diharapkan |
|-----------|----------------------|
| Customer tidak isi quantity untuk item kapasitas-bound | Quantity otomatis minimum |
| Customer isi quantity sama dengan minimum | Request diterima |
| Customer isi quantity lebih dari minimum | Request diterima |
| Customer isi quantity kurang dari minimum | Request ditolak |
| Customer tidak isi quantity untuk item non kapasitas-bound | Request ditolak |
| Customer memilih range dan mengisi berat custom dalam rentang | Request berhasil |
| Customer memilih range dan mengisi berat custom di luar rentang | Request ditolak |
| Request pickup menyertakan item yang tidak tersedia untuk customer | Request ditolak |
| Request pickup tanpa kategori berat | Request ditolak |
| Admin menambah kategori berat tanpa overlap | Berhasil disimpan |
| Admin menambah kategori berat yang overlap | Ditolak |
| Admin menonaktifkan kategori berat yang sudah dipakai order lama | Tidak muncul lagi untuk customer baru, data lama tetap valid |
