// src/modules/report/inventory-usage.ts
//
// pdfkit PDF generator for the inventory usage report.

import PDFDocument from "pdfkit";

// ─── Colours & layout constants ───────────────────────────────────────────────
const NAVY = "#1e3a5f";
const LIGHT_BG = "#f7fafc";
const BORDER = "#e2e8f0";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#888888";

const PAGE_MARGIN = 40;
const COL_WIDTHS = [25, 90, 110, 60, 60, 80, 90]; // sum = 515
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 24;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const colX = (colIndex: number): number => {
  let x = PAGE_MARGIN;
  for (let i = 0; i < colIndex; i++) {
    x += COL_WIDTHS[i] ?? 0;
  }
  return x;
};

const tableWidth = COL_WIDTHS.reduce((a, b) => a + b, 0);

// ─── Types ────────────────────────────────────────────────────────────────────
export type UsageReportItem = {
  id: string;
  orderId: string | null;
  inventoryName: string | null;
  change: number;
  stockRemaining: number;
  actorName: string | null;
  createdAt: string;
};

// ─── Generator ────────────────────────────────────────────────────────────────
export function generateUsagePDF(
  from: string,
  to: string,
  items: UsageReportItem[]
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
        Title: `Laporan Penggunaan Inventori ${from} - ${to}`,
        Author: "Sistem Manajemen Laundry",
        Subject: "Laporan Inventori",
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
      .text("LAPORAN PENGGUNAAN INVENTORI", PAGE_MARGIN, 42);

    // ── Meta block ────────────────────────────────────────────────────────────
    let y = 90;

    const metaRows: [string, string][] = [
      ["Periode Laporan", `: ${from} s/d ${to}`],
      ["Tanggal Cetak", `: ${printedAt} WIB`],
      ["Jumlah Transaksi", `: ${items.length} penggunaan stok`],
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
      "Laporan ini merinci penggunaan stok inventori yang terjadi secara otomatis melalui " +
      `pesanan pelanggan selama periode ${from} hingga ${to}. Mencakup informasi ID pesanan, ` +
      "nama item, jumlah yang digunakan, dan sisa stok.";

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

    // ── Table header ──────────────────────────────────────────────────────────
    doc.rect(PAGE_MARGIN, y, tableWidth, HEADER_HEIGHT).fill(NAVY);

    const headers = [
      { text: "No", align: "center" },
      { text: "ID Pesanan", align: "left" },
      { text: "Nama Item", align: "left" },
      { text: "Jumlah", align: "center" },
      { text: "Sisa", align: "center" },
      { text: "Tanggal", align: "center" },
      { text: "Oleh", align: "left" },
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

        const dateStr = item.createdAt.split(" ")[0] ?? "-";

        const cells = [
          { text: String(idx + 1), align: "center" },
          { text: item.orderId ?? "-", align: "left" },
          { text: item.inventoryName ?? "-", align: "left" },
          { text: String(Math.abs(item.change)), align: "center" },
          { text: String(item.stockRemaining), align: "center" },
          { text: dateStr, align: "center" },
          { text: item.actorName ?? "-", align: "left" },
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
