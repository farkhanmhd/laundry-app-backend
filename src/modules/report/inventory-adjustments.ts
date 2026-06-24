import PDFDocument from "pdfkit";

// ─── Colours & layout constants ───────────────────────────────────────────────
const NAVY = "#1e3a5f";
const LIGHT_BG = "#f7fafc";
const BORDER = "#e2e8f0";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#888888";

const PAGE_MARGIN = 40;
const COL_WIDTHS = [37, 130, 60, 60, 140, 88];
const HEADER_HEIGHT = 24;

const BOTTOM_SAFE_ZONE = 50;
const CELL_PADDING_TOP = 5;
const CELL_PADDING_BOTTOM = 5;
const CELL_PADDING_H = 6;
const MIN_ROW_HEIGHT = 20;
const HEADER_BAR_HEIGHT = 70;
const TABLE_TOP = HEADER_BAR_HEIGHT + 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const colX = (colIndex: number): number => {
  let x = PAGE_MARGIN;
  for (let i = 0; i < colIndex; i++) {
    x += COL_WIDTHS[i] ?? 0;
  }
  return x;
};

const tableWidth = COL_WIDTHS.reduce((a, b) => a + b, 0);

const cellWidth = (colIndex: number) =>
  (COL_WIDTHS[colIndex] ?? 0) - CELL_PADDING_H * 2;

// ─── Types ────────────────────────────────────────────────────────────────────
export type AdjustmentReportItem = {
  id: string;
  inventoryName: string | null;
  change: number;
  note: string | null;
  actorName: string | null;
  createdAt: string;
};

type HeaderDef = { text: string; align: "left" | "center" | "right" };
type CellDef = {
  text: string;
  align: "left" | "center" | "right";
  color?: string;
  bold?: boolean;
};

const HEADERS: readonly HeaderDef[] = [
  { text: "No", align: "center" },
  { text: "Nama Item", align: "left" },
  { text: "Perubahan", align: "center" },
  { text: "Keterangan", align: "left" },
  { text: "Oleh", align: "left" },
];

// ─── Generator ────────────────────────────────────────────────────────────────
export function generateAdjustmentPDF(
  from: string,
  to: string,
  items: AdjustmentReportItem[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margins: {
        top: PAGE_MARGIN,
        bottom: PAGE_MARGIN,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
      },
      info: {
        Title: `Laporan Penyesuaian Stok ${from} - ${to}`,
        Author: "Sistem Manajemen Laundry",
        Subject: "Laporan Inventori",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - PAGE_MARGIN * 2;

    let pageNumber = 1;
    const pageFooters: { y: number }[] = [];

    const drawPageHeader = () => {
      doc.rect(0, 0, pageWidth, HEADER_BAR_HEIGHT).fill(NAVY);
      doc
        .fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Beringin Coin Laundry", PAGE_MARGIN, 18);
      doc
        .fillColor("#a8c4e0")
        .font("Helvetica")
        .fontSize(10)
        .text("LAPORAN PENYESUAIAN STOK", PAGE_MARGIN, 42);
    };

    doc.on("pageAdded", () => {
      pageNumber++;
      drawPageHeader();
    });

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
      .text("LAPORAN PENYESUAIAN STOK", PAGE_MARGIN, 42);

    // ── Meta block ────────────────────────────────────────────────────────────
    let y = 90;

    const metaRows: [string, string][] = [
      ["Periode Laporan", `: ${from} s/d ${to}`],
      ["Tanggal Cetak", `: ${printedAt} WIB`],
      ["Jumlah Catatan", `: ${items.length} log penyesuaian`],
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
      "Laporan ini mencatat semua perubahan stok inventori yang dilakukan secara manual oleh staf " +
      `(penyesuaian mandiri) selama periode ${from} hingga ${to}. Tidak mencakup penggunaan stok ` +
      "otomatis dari pesanan pelanggan.";

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

    // ── Helper to draw table header ────────────────────────────────────────────
    const drawTableHeader = (startY: number): number => {
      doc.rect(PAGE_MARGIN, startY, tableWidth, HEADER_HEIGHT).fill(NAVY);

      HEADERS.forEach((h, i) => {
        doc
          .fillColor("white")
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(h.text, colX(i) + CELL_PADDING_H, startY + 7, {
            width: cellWidth(i),
            align: h.align,
          });
      });

      return startY + HEADER_HEIGHT;
    };

    // ── Helper to compute row height ───────────────────────────────────────────
    const computeRowHeight = (cells: CellDef[]): number => {
      doc.fontSize(8.5).font("Helvetica");
      let maxH = MIN_ROW_HEIGHT;
      cells.forEach((cell, ci) => {
        const textH =
          doc.heightOfString(cell.text, { width: cellWidth(ci) }) +
          CELL_PADDING_TOP +
          CELL_PADDING_BOTTOM;
        if (textH > maxH) {
          maxH = textH;
        }
      });
      return maxH;
    };

    // ── Helper to draw footer (page number + info) ─────────────────────────────
    const drawFooter = () => {
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

      pageFooters[pageNumber] = { y: footerY };
    };

    // ── Table header (first page) ──────────────────────────────────────────────
    y = drawTableHeader(y);

    // ── Table rows ────────────────────────────────────────────────────────────
    if (items.length === 0) {
      drawFooter();

      doc.rect(PAGE_MARGIN, y, tableWidth, MIN_ROW_HEIGHT + 8).fill("#ffffff");
      doc
        .fillColor(TEXT_MUTED)
        .font("Helvetica")
        .fontSize(9)
        .text("Tidak ada data pada periode yang dipilih", PAGE_MARGIN, y + 8, {
          width: tableWidth,
          align: "center",
        });
      y += MIN_ROW_HEIGHT + 8;
    } else {
      items.forEach((item, idx) => {
        const changeStr =
          item.change > 0 ? `+${item.change}` : String(item.change);
        const changeColor = item.change > 0 ? "#2f855a" : "#c53030";

        const cells: CellDef[] = [
          { text: String(idx + 1), align: "center", color: TEXT_DARK },
          { text: item.inventoryName ?? "-", align: "left", color: TEXT_DARK },
          { text: changeStr, align: "center", color: changeColor, bold: true },
          { text: item.note ?? "-", align: "left", color: TEXT_DARK },
          { text: item.actorName ?? "-", align: "left", color: TEXT_DARK },
        ];

        doc.font("Helvetica").fontSize(8.5);
        const rowHeight = computeRowHeight(cells);

        if (y + rowHeight > doc.page.height - PAGE_MARGIN - BOTTOM_SAFE_ZONE) {
          drawFooter();
          doc.addPage();
          y = drawTableHeader(TABLE_TOP);
        }

        const rowBg = idx % 2 === 0 ? "#ffffff" : LIGHT_BG;
        doc.rect(PAGE_MARGIN, y, tableWidth, rowHeight).fill(rowBg);

        doc
          .moveTo(PAGE_MARGIN, y + rowHeight)
          .lineTo(PAGE_MARGIN + tableWidth, y + rowHeight)
          .strokeColor(BORDER)
          .lineWidth(0.5)
          .stroke();

        doc.fontSize(8.5);
        cells.forEach((cell, ci) => {
          doc
            .fillColor(cell.color ?? TEXT_DARK)
            .font(cell.bold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(8.5)
            .text(cell.text, colX(ci) + CELL_PADDING_H, y + CELL_PADDING_TOP, {
              width: cellWidth(ci),
              align: cell.align,
            });
        });

        y += rowHeight;
      });
    }

    drawFooter();

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footer = pageFooters[i + 1];
      if (footer) {
        const txt = `Halaman ${i + 1} dari ${range.count}`;
        doc
          .fillColor(TEXT_MUTED)
          .font("Helvetica")
          .fontSize(8)
          .text(txt, pageWidth - PAGE_MARGIN - doc.widthOfString(txt), footer.y);
      }
    }

    doc.end();
  });
}
