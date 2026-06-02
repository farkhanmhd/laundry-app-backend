# Implementation Plan: Order Receipt PDF Generation

## Objective
Add a `GET /receipt/:id/pdf` endpoint that generates a thermal-receipt-style PDF (black & white, receipt paper dimensions) for a given order.

---

## Files to Create

| File | Action |
|---|---|
| `src/modules/receipt/receipt-pdf.ts` | **Create** — PDF generation function |

## Files to Modify

| File | Change |
|---|---|
| `src/modules/receipt/service.ts` | Add `getReceiptData()` static method that fetches all receipt data in one query |
| `src/modules/receipt/index.ts` | Add `GET /:id/pdf` route |

---

## Type Definitions

```typescript
type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

type ReceiptData = {
  orderId: string;
  customerName: string;
  phone: string;
  memberId: string | null;
  status: string;
  createdAt: string;
  items: ReceiptItem[];
  voucher: { code: string; description: string; discountAmount: number } | null;
  points: number | null;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentType: string;
  amountPaid: number;
  change: number;
};
```

---

## Receipt Layout (Wireframe)

```
┌──────────────────────────────┐
│    BERINGIN COIN LAUNDRY     │
│     Jl. Contoh No. 123       │
│     Telp: 0812-3456-7890     │
│                              │
│  Order: o-A1B2C3D            │
│  Date: 02/06/2026 14:30     │
│  Status: Completed           │
│ ──────────────────────────── │
│  Customer: John Doe          │
│  Phone: +628123456789       │
│  Member: m-ABC123            │
│ ──────────────────────────── │
│  # │ Item           │  Rp   │
│ ───┼────────────────┼────── │
│  2 │ Laundry Reguler│ 20,000│
│  1 │ Softener       │  5,000│
│    │                │       │
│    │ Subtotal       │ 25,000│
│    │ Voucher DIS10  │ (2,500)│
│    │ Points         │ (1,000)│
│    │ ────────────── │───────│
│    │ TOTAL         │ 21,500│
│ ──────────────────────────── │
│  Cash          Rp 25,000    │
│  Change        Rp  3,500    │
│ ──────────────────────────── │
│   Terima kasih telah         │
│   menggunakan jasa kami!     │
│                              │
│   Printed: 02/06/2026 14:35 │
└──────────────────────────────┘
```

---

## `src/modules/receipt/receipt-pdf.ts`

PDF generator function using PDFKit:

- **Paper size**: `[284, 600]` (72mm width) with 10pt margins — mimics thermal receipt width
- **Font**: Helvetica (built-in), sizes 9pt body / 11pt header / 7pt footer
- **Colors only**: `#000000` (black) and `#666666` / `#999999` (grays) — no accent colors
- **Dividers**: Dashed line via `doc.dash(3, { space: 3 })`
- **Alignment**: Left-aligned descriptions, right-aligned prices/numbers
- **No images or logos** — pure text layout (thermal printer aesthetic)

### Functions inside the file

| Function | Purpose |
|---|---|
| `drawHeader(doc, data)` | Business name, address placeholder, order ID, date, status |
| `drawDivider(doc, y)` | Dashed separator line |
| `drawCustomerInfo(doc, data, startY)` | Customer name, phone, member ID |
| `drawItemsTable(doc, data, startY)` | Table of items with qty, name, price, subtotal |
| `drawTotals(doc, data, startY)` | Subtotal, voucher discount, points, grand total |
| `drawPayment(doc, data, startY)` | Payment type, amount paid, change |
| `drawFooter(doc, y)` | Thank you message, print timestamp |

### Export

```typescript
export function generateReceiptPDF(data: ReceiptData): Promise<Buffer>
```

Returns `Promise<Buffer>` following the same pattern as `sales-by-order.ts`.

---

## `src/modules/receipt/service.ts` — New Method

Add to `ReceiptService` class:

```typescript
static async getReceiptData(id: string): Promise<ReceiptData>
```

One query that joins:
- `orders` (id, customerName, status, createdAt)
- `members` (name, phone) via `orders.memberId`
- `order_items` (itemType, quantity, subtotal, voucherId) with left joins to `services`, `inventories`, `bundlings`, `vouchers`
- `payments` (paymentType, amountPaid, change, total, discountAmount)

Computes in TypeScript:
- `subtotal` = sum of all service/inventory/bundling item subtotals
- `discountTotal` = voucher discount amount + points deducted
- `grandTotal` = total from payment record

Throws `NotFoundError` if order does not exist.

---

## `src/modules/receipt/index.ts` — New Route

```typescript
.get("/:id/pdf", async ({ params, set, session }) => {
  const data = await ReceiptService.getReceiptData(params.id);
  const pdfBuffer = await generateReceiptPDF(data);
  const filename = `receipt-${params.id}.pdf`;
  set.headers["Content-Type"] = "application/pdf";
  set.headers["Content-Disposition"] = `inline; filename="${filename}"`;
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}, {
  detail: { description: "Generate a receipt PDF for a given order." },
  isAdmin: true,
})
```

- Auth: `isAdmin` (staff only) — receipt is sensitive
- Returns `application/pdf` with `inline` disposition so it renders in the browser

---

## Dependencies

All already installed — **no new packages**:
- `pdfkit` ^0.18.0 ✓
- `@types/pdfkit` ^0.17.6 ✓

---

## Registration

No changes to `server.ts` needed — the `receiptController` is already registered at line 95.

---

## Implementation Order

1. Create `src/modules/receipt/receipt-pdf.ts` — the PDF generator
2. Add `getReceiptData()` to `src/modules/receipt/service.ts`
3. Add `GET /:id/pdf` route to `src/modules/receipt/index.ts`
4. Test with `curl -o receipt.pdf http://localhost:3001/receipt/o-xxxxx/pdf`

---

## Future Considerations

- Make business info (name, address, phone) configurable via env vars or a settings table
- Add QRIS QR code image on receipt for QRIS payments
- Reprint history tracking with print count
- Support for multiple receipt paper sizes (80mm, 58mm)
