# Frontend Translation Prompts — Orders & POS

The backend now sends `messageKey` and `messageParams` on every JSON response that carries a `message`. Add the following entries under the `"Notifications"` namespace in `messages/en.json` and `messages/id.json`.

> **⚠️ Important: No dots in JSON keys** — `next-intl` uses `.` as its nesting separator. Use **nested objects** instead:
> ```json
> // ❌ INVALID
> { "Notifications": { "member.created": "..." } }
> // ✅ CORRECT
> { "Notifications": { "member": { "created": "..." } } }
> ```

---

## Orders (`order.*`)

| messageKey | messageParams | English | Indonesian |
|---|---|---|---|
| `order.notification.received` | — | "Notification Received" | "Notifikasi diterima" |
| `order.retrieved` | — | "Orders retrieved successfully" | "Pesanan berhasil diambil" |
| `order.status.retrieved` | — | "Order Status Retrieved" | "Status pesanan berhasil diambil" |
| `order.status.updated` | — | "Order Status Updated" | "Status pesanan berhasil diperbarui" |
| `order.statusUpdated` | — | "Order status updated successfully" | "Status pesanan berhasil diperbarui" |
| `order.items.retrieved` | — | "Order Items Retrieved" | "Item pesanan berhasil diambil" |
| `order.payment.retrieved` | — | "Order Payment Retrieved" | "Pembayaran pesanan berhasil diambil" |
| `order.customer.retrieved` | — | "Order Customer Retrieved" | "Pelanggan pesanan berhasil diambil" |
| `order.deliveries.retrieved` | — | "Order Deliveries Retrieved" | "Pengiriman pesanan berhasil diambil" |
| `order.paymentDetails.retrieved` | — | "Order Payment Details Retrieved" | "Detail pembayaran pesanan berhasil diambil" |
| `order.paymentDetails.notFound` | — | "Payment details not found" | "Detail pembayaran tidak ditemukan" |
| `order.created` | — | "New order created successfully" | "Pesanan baru berhasil dibuat" |
| `order.updated` | — | "Order updated successfully" | "Pesanan berhasil diperbarui" |
| `order.cancelled` | `{ orderId }` | "Order {orderId} cancelled successfully" | "Pesanan {orderId} berhasil dibatalkan" |
| `order.notFound` | — | "Order not found" | "Pesanan tidak ditemukan" |
| `order.qris.charged` | — | "QRIS payment charged successfully" | "Pembayaran QRIS berhasil dikenakan" |
| `order.report.orderSummary` | — | "Order summary retrieved successfully" | "Ringkasan pesanan berhasil diambil" |
| `order.report.dailyRevenue` | — | "Daily revenue retrieved successfully" | "Pendapatan harian berhasil diambil" |
| `order.report.paymentMethodStats` | — | "Payment method statistics retrieved successfully" | "Statistik metode pembayaran berhasil diambil" |

---

## POS (`pos.*`)

| messageKey | messageParams | English | Indonesian |
|---|---|---|---|
| `pos.items.retrieved` | — | "Pos Items Retrieved" | "Item POS berhasil diambil" |
| `pos.order.created` | — | "New Pos Order Created" | "Pesanan POS baru berhasil dibuat" |
| `pos.members.retrieved` | — | "Member search success" | "Pencarian member berhasil" |
| `pos.vouchers.retrieved` | — | "Pos Vouchers Retrieved" | "Voucher POS berhasil diambil" |
| `pos.voucher.retrieved` | — | "Voucher Added" | "Voucher berhasil ditambahkan" |
| `pos.voucher.notFound` | — | "Voucher not found" | "Voucher tidak ditemukan" |

## Implementation steps

1. Open `messages/en.json` and `messages/id.json`
2. Under the existing `"Notifications"` key, add the entries as **nested objects** (dots are NOT valid in JSON keys)
3. Use `{placeholders}` matching the `messageParams` keys (e.g., `{orderId}`)
4. The frontend looks up translations via: `t("Notifications.{messageKey}")`

**Example en.json structure:**

```json
{
  "Notifications": {
    "order": {
      "notification": { "received": "Notification Received" },
      "retrieved": "Orders retrieved successfully",
      "status": {
        "retrieved": "Order Status Retrieved",
        "updated": "Order Status Updated"
      },
      "statusUpdated": "Order status updated successfully",
      "items": { "retrieved": "Order Items Retrieved" },
      "payment": { "retrieved": "Order Payment Retrieved" },
      "customer": { "retrieved": "Order Customer Retrieved" },
      "deliveries": { "retrieved": "Order Deliveries Retrieved" },
      "paymentDetails": {
        "retrieved": "Order Payment Details Retrieved",
        "notFound": "Payment details not found"
      },
      "created": "New order created successfully",
      "updated": "Order updated successfully",
      "cancelled": "Order {orderId} cancelled successfully",
      "notFound": "Order not found",
      "qris": { "charged": "QRIS payment charged successfully" },
      "report": {
        "orderSummary": "Order summary retrieved successfully",
        "dailyRevenue": "Daily revenue retrieved successfully",
        "paymentMethodStats": "Payment method statistics retrieved successfully"
      }
    },
    "pos": {
      "items": { "retrieved": "Pos Items Retrieved" },
      "order": { "created": "New Pos Order Created" },
      "members": { "retrieved": "Member search success" },
      "vouchers": { "retrieved": "Pos Vouchers Retrieved" },
      "voucher": {
        "retrieved": "Voucher Added",
        "notFound": "Voucher not found"
      }
    }
  }
}
```

**Example id.json structure:**

```json
{
  "Notifications": {
    "order": {
      "notification": { "received": "Notifikasi diterima" },
      "retrieved": "Pesanan berhasil diambil",
      "status": {
        "retrieved": "Status pesanan berhasil diambil",
        "updated": "Status pesanan berhasil diperbarui"
      },
      "statusUpdated": "Status pesanan berhasil diperbarui",
      "items": { "retrieved": "Item pesanan berhasil diambil" },
      "payment": { "retrieved": "Pembayaran pesanan berhasil diambil" },
      "customer": { "retrieved": "Pelanggan pesanan berhasil diambil" },
      "deliveries": { "retrieved": "Pengiriman pesanan berhasil diambil" },
      "paymentDetails": {
        "retrieved": "Detail pembayaran pesanan berhasil diambil",
        "notFound": "Detail pembayaran tidak ditemukan"
      },
      "created": "Pesanan baru berhasil dibuat",
      "updated": "Pesanan berhasil diperbarui",
      "cancelled": "Pesanan {orderId} berhasil dibatalkan",
      "notFound": "Pesanan tidak ditemukan",
      "qris": { "charged": "Pembayaran QRIS berhasil dikenakan" },
      "report": {
        "orderSummary": "Ringkasan pesanan berhasil diambil",
        "dailyRevenue": "Pendapatan harian berhasil diambil",
        "paymentMethodStats": "Statistik metode pembayaran berhasil diambil"
      }
    },
    "pos": {
      "items": { "retrieved": "Item POS berhasil diambil" },
      "order": { "created": "Pesanan POS baru berhasil dibuat" },
      "members": { "retrieved": "Pencarian member berhasil" },
      "vouchers": { "retrieved": "Voucher POS berhasil diambil" },
      "voucher": {
        "retrieved": "Voucher berhasil ditambahkan",
        "notFound": "Voucher tidak ditemukan"
      }
    }
  }
}
```
