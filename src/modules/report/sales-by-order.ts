// src/modules/report/sales-by-order.ts
//
// pdfkit PDF generator for the sales by order report.

import PDFDocument from "pdfkit";

// ─── Colours & layout constants ───────────────────────────────────────────────
const NAVY = "#1e3a5f";
const LIGHT_BG = "#f7fafc";
const BORDER = "#e2e8f0";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#888888";

const PAGE_MARGIN = 40;
const COL_WIDTHS = [70, 95, 45, 75, 75, 70, 85]; // sum = 515
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 24;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatIDR = (n: number | string | null) => {
  const num = typeof n === "string" ? Number.parseFloat(n) : n;
  if (num === null || Number.isNaN(num)) {
    return "Rp 0";
  }
  return `Rp ${Math.round(num).toLocaleString("id-ID").replace(/\./g, ".")}`;
};

const formatPaymentType = (t: string | null) => {
  if (!t) {
    return "-";
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const colX = (colIndex: number): number => {
  let x = PAGE_MARGIN;
  for (let i = 0; i < colIndex; i++) {
    x += COL_WIDTHS[i] ?? 0;
  }
  return x;
};

const tableWidth = COL_WIDTHS.reduce((a, b) => a + b, 0);

// ─── Types ────────────────────────────────────────────────────────────────────
export type SalesByOrderItem = {
  id: string;
  member: string | null;
  totalItems: number;
  paymentType: string | null;
  itemsTotal: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  change: number | null;
  createdAt: string;
};

// ─── Generator ────────────────────────────────────────────────────────────────
export function generateSalesByOrderPDF(
  from: string,
  to: string,
  items: SalesByOrderItem[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PAGE_MARGIN,
        bottom: PAGE_MARGIN,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
      },
      info: {
        Title: `Laporan Penjualan per Pesanan ${from} - ${to}`,
        Author: "Sistem Manajemen Laundry",
        Subject: "Laporan Penjualan",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - PAGE_MARGIN * 2;

    const printedAt = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

    const totalRevenue = items.reduce((acc, i) => acc + Number(i.total), 0);
    const totalDiscount = items.reduce(
      (acc, i) => acc + Number(i.discountAmount),
      0
    );
    const totalItemsCount = items.reduce(
      (acc, i) => acc + Number(i.totalItems),
      0
    );

    // ── Header bar ────────────────────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, 70).fill(NAVY);

    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Beringin Coin Laundry", PAGE_MARGIN, 18);

    doc
      .fillColor("#a8c4e0")
      .font("Helvetica")
      .fontSize(10)
      .text("LAPORAN PENJUALAN PER PESANAN", PAGE_MARGIN, 42);

    // ── Meta block ────────────────────────────────────────────────────────────
    let y = 90;

    const metaRows: [string, string][] = [
      ["Periode Laporan", `: ${from} s/d ${to}`],
      ["Tanggal Cetak", `: ${printedAt} WIB`],
      ["Jumlah Transaksi", `: ${items.length} pesanan`],
    ];

    for (const [label, value] of metaRows) {
      doc
        .fillColor(TEXT_MUTED)
        .font("Helvetica")
        .fontSize(9)
        .text(label, PAGE_MARGIN, y, { width: 130 });

      doc
        .fillColor(TEXT_DARK)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(value, PAGE_MARGIN + 130, y);

      y += 14;
    }

    y += 6;

    // ── Description box ───────────────────────────────────────────────────────
    const descText =
      "Laporan ini merinci setiap transaksi penjualan yang terjadi selama periode " +
      `${from} hingga ${to}. Mencakup informasi ID pesanan, nama pelanggan, jumlah item, ` +
      "metode pembayaran, serta rincian finansial (subtotal, diskon, dan total bayar). " +
      "Hanya mencatat transaksi dengan status diproses, siap, dan selesai.";

    doc.fontSize(9);
    const descHeight =
      doc.heightOfString(descText, {
        width: contentWidth - 16,
      }) + 16;

    doc.rect(PAGE_MARGIN, y, contentWidth, descHeight).fill("#f0f4f8");
    doc.rect(PAGE_MARGIN, y, 4, descHeight).fill(NAVY);

    doc
      .fillColor(TEXT_DARK)
      .font("Helvetica")
      .fontSize(9)
      .text(descText, PAGE_MARGIN + 12, y + 8, {
        width: contentWidth - 20,
        lineGap: 2,
      });

    y += descHeight + 14;

    // ── Summary cards ─────────────────────────────────────────────────────────
    const cardW = (contentWidth - 16) / 3;
    const cardH = 44;
    const cards = [
      ["Total Pendapatan (Net)", formatIDR(totalRevenue)],
      ["Total Diskon Berikan", formatIDR(totalDiscount)],
      ["Total Item Terjual", `${totalItemsCount} item`],
    ];

    cards.forEach(([label, value], i) => {
      const cx = PAGE_MARGIN + i * (cardW + 8);
      if (label && value) {
        doc.rect(cx, y, cardW, cardH).fill("#f8fafc").stroke(BORDER);
        doc
          .fillColor(TEXT_MUTED)
          .font("Helvetica")
          .fontSize(8)
          .text(label.toUpperCase(), cx + 10, y + 8, { width: cardW - 20 });
        doc
          .fillColor(NAVY)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(value, cx + 10, y + 22, { width: cardW - 20 });
      }
    });

    y += cardH + 16;

    // ── Table header ──────────────────────────────────────────────────────────
    doc.rect(PAGE_MARGIN, y, tableWidth, HEADER_HEIGHT).fill(NAVY);

    const headers = [
      { text: "ID Pesanan", align: "left" },
      { text: "Pelanggan", align: "left" },
      { text: "Items", align: "center" },
      { text: "Bayar", align: "center" },
      { text: "Subtotal", align: "right" },
      { text: "Diskon", align: "right" },
      { text: "Total", align: "right" },
    ] as const;

    headers.forEach((h, i) => {
      doc
        .fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(h.text, colX(i) + 6, y + 7, {
          width: (COL_WIDTHS[i] ?? 0) - 12,
          align: h.align,
        });
    });

    y += HEADER_HEIGHT;

    // ── Table rows ────────────────────────────────────────────────────────────
    if (items.length === 0) {
      doc.rect(PAGE_MARGIN, y, tableWidth, ROW_HEIGHT + 8).fill("#ffffff");
      doc
        .fillColor(TEXT_MUTED)
        .font("Helvetica")
        .fontSize(9)
        .text("Tidak ada data pada periode yang dipilih", PAGE_MARGIN, y + 8, {
          width: tableWidth,
          align: "center",
        });
      y += ROW_HEIGHT + 8;
    } else {
      items.forEach((item, idx) => {
        if (y + ROW_HEIGHT * 2 > doc.page.height - PAGE_MARGIN - 40) {
          doc.addPage();
          y = PAGE_MARGIN;
        }

        const rowBg = idx % 2 === 0 ? "#ffffff" : LIGHT_BG;
        doc.rect(PAGE_MARGIN, y, tableWidth, ROW_HEIGHT).fill(rowBg);

        doc
          .moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
          .lineTo(PAGE_MARGIN + tableWidth, y + ROW_HEIGHT)
          .strokeColor(BORDER)
          .lineWidth(0.5)
          .stroke();

        const cells = [
          { text: item.id, align: "left" },
          { text: item.member ?? "Umum", align: "left" },
          { text: String(item.totalItems), align: "center" },
          { text: formatPaymentType(item.paymentType), align: "center" },
          { text: formatIDR(item.itemsTotal), align: "right" },
          { text: formatIDR(item.discountAmount), align: "right" },
          { text: formatIDR(item.total), align: "right" },
        ] as const;

        cells.forEach((cell, ci) => {
          doc
            .fillColor(TEXT_DARK)
            .font("Helvetica")
            .fontSize(8.5)
            .text(cell.text, colX(ci) + 6, y + 5, {
              width: (COL_WIDTHS[ci] ?? 0) - 12,
              align: cell.align,
              ellipsis: true,
              lineBreak: false,
            });
        });

        y += ROW_HEIGHT;
      });

      // ── Total row ─────────────────────────────────────────────────────────
      if (y + ROW_HEIGHT > doc.page.height - PAGE_MARGIN - 20) {
        doc.addPage();
        y = PAGE_MARGIN;
      }

      doc.rect(PAGE_MARGIN, y, tableWidth, ROW_HEIGHT).fill("#eef2f7");
      doc
        .moveTo(PAGE_MARGIN, y)
        .lineTo(PAGE_MARGIN + tableWidth, y)
        .strokeColor(NAVY)
        .lineWidth(1)
        .stroke();
      doc
        .moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
        .lineTo(PAGE_MARGIN + tableWidth, y + ROW_HEIGHT)
        .strokeColor(NAVY)
        .lineWidth(1)
        .stroke();

      const totalLabelWidth = (COL_WIDTHS[0] ?? 0) + (COL_WIDTHS[1] ?? 0);

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text("TOTAL", colX(0) + 6, y + 5, {
          width: totalLabelWidth - 12,
          align: "right",
        });

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(String(totalItemsCount), colX(2) + 6, y + 5, {
          width: (COL_WIDTHS[2] ?? 0) - 12,
          align: "center",
        });

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(
          formatIDR(items.reduce((acc, i) => acc + Number(i.itemsTotal), 0)),
          colX(4) + 6,
          y + 5,
          {
            width: (COL_WIDTHS[4] ?? 0) - 12,
            align: "right",
          }
        );

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(formatIDR(totalDiscount), colX(5) + 6, y + 5, {
          width: (COL_WIDTHS[5] ?? 0) - 12,
          align: "right",
        });

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(formatIDR(totalRevenue), colX(6) + 6, y + 5, {
          width: (COL_WIDTHS[6] ?? 0) - 12,
          align: "right",
        });

      y += ROW_HEIGHT;
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - PAGE_MARGIN - 16;

    doc
      .moveTo(PAGE_MARGIN, footerY - 6)
      .lineTo(pageWidth - PAGE_MARGIN, footerY - 6)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(TEXT_MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Dicetak otomatis oleh sistem — ${printedAt} WIB`,
        PAGE_MARGIN,
        footerY
      );

    doc
      .fillColor(TEXT_MUTED)
      .font("Helvetica")
      .fontSize(8)
      .text(`Periode: ${from} – ${to}`, PAGE_MARGIN, footerY, {
        width: contentWidth,
        align: "right",
      });

    doc.end();
  });
}
