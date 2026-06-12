import PDFDocument from "pdfkit";

// ─── Colours & layout constants ───────────────────────────────────────────────
const NAVY = "#1e3a5f";
const LIGHT_BG = "#f7fafc";
const BORDER = "#e2e8f0";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#888888";

const PAGE_MARGIN = 40;
const COL_WIDTHS = [37, 100, 80, 70, 80, 80, 68];
const HEADER_HEIGHT = 24;

const BOTTOM_SAFE_ZONE = 50;
const CELL_PADDING_TOP = 5;
const CELL_PADDING_BOTTOM = 5;
const CELL_PADDING_H = 6;
const MIN_ROW_HEIGHT = 20;
const HEADER_BAR_HEIGHT = 70;
const TABLE_TOP = HEADER_BAR_HEIGHT + 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatIDR = (n: number | string | null) => {
  const num = typeof n === "string" ? Number.parseFloat(n) : n;
  if (num === null || Number.isNaN(num)) {
    return "Rp 0";
  }
  return `Rp ${Math.round(num).toLocaleString("id-ID").replace(/\./g, ".")}`;
};

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
export type MemberSpendingItem = {
  id: string;
  name: string | null;
  phone: string | null;
  joinDate: string | Date | null;
  totalSpending: number;
  orderCount: number;
  averageSpending: number;
};

type HeaderDef = { text: string; align: "left" | "center" | "right" };
type CellDef = { text: string; align: "left" | "center" | "right" };

const HEADERS: readonly HeaderDef[] = [
  { text: "No", align: "center" },
  { text: "Nama Member", align: "left" },
  { text: "Telepon", align: "left" },
  { text: "Order", align: "center" },
  { text: "Rata-rata", align: "right" },
  { text: "Total", align: "right" },
];

// ─── Generator ────────────────────────────────────────────────────────────────
export function generateMemberSpendingPDF(
  from: string,
  to: string,
  items: MemberSpendingItem[]
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
        Title: `Laporan Pengeluaran Member ${from} - ${to}`,
        Author: "Sistem Manajemen Laundry",
        Subject: "Laporan Member",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - PAGE_MARGIN * 2;

    let pageNumber = 1;

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
        .text(
          `MEMBER DENGAN PENGELUARAN TERTINGGI (${from} - ${to})`,
          PAGE_MARGIN,
          42
        );
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

    const totalRevenue = items.reduce((acc, i) => acc + i.totalSpending, 0);
    const totalOrders = items.reduce((acc, i) => acc + i.orderCount, 0);

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
      .text(
        `MEMBER DENGAN PENGELUARAN TERTINGGI (${from} - ${to})`,
        PAGE_MARGIN,
        42
      );

    // ── Meta block ────────────────────────────────────────────────────────────
    let y = 90;

    const metaRows: [string, string][] = [
      ["Periode Laporan", `: ${from} s/d ${to}`],
      ["Tanggal Cetak", `: ${printedAt} WIB`],
      ["Jumlah Member", `: ${items.length} member tercatat`],
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
      `Laporan ini menampilkan daftar member dengan pengeluaran tertinggi selama periode ${from} hingga ${to}. ` +
      "Data mencakup total transaksi, akumulasi nominal pengeluaran, dan nilai rata-rata transaksi per member. " +
      "Diurutkan berdasarkan total pengeluaran tertinggi.";

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
      ["Total Pendapatan", formatIDR(totalRevenue)],
      ["Total Transaksi", totalOrders.toLocaleString("id-ID")],
      ["Jumlah Member", `${items.length} orang`],
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

      doc
        .fillColor(TEXT_MUTED)
        .font("Helvetica")
        .fontSize(8)
        .text(`${pageNumber}`, pageWidth - PAGE_MARGIN, footerY, {
          align: "right",
        });
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
        const cells: CellDef[] = [
          { text: String(idx + 1), align: "center" },
          { text: item.name ?? "-", align: "left" },
          { text: item.phone ?? "-", align: "left" },
          { text: String(item.orderCount), align: "center" },
          { text: formatIDR(item.averageSpending), align: "right" },
          { text: formatIDR(item.totalSpending), align: "right" },
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

        doc.font("Helvetica").fontSize(8.5);
        cells.forEach((cell, ci) => {
          doc
            .fillColor(TEXT_DARK)
            .font("Helvetica")
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
    doc.end();
  });
}
