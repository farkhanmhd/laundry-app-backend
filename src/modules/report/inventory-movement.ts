import PDFDocument from "pdfkit";

const NAVY = "#1e3a5f";
const LIGHT_BG = "#f7fafc";
const BORDER = "#e2e8f0";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#888888";

const PAGE_MARGIN = 40;
const COL_WIDTHS = [30, 65, 65, 65, 60, 65, 85, 80];
const HEADER_HEIGHT = 24;

const BOTTOM_SAFE_ZONE = 50;
const CELL_PADDING_TOP = 5;
const CELL_PADDING_BOTTOM = 5;
const CELL_PADDING_H = 6;
const MIN_ROW_HEIGHT = 20;
const HEADER_BAR_HEIGHT = 70;
const TABLE_TOP = HEADER_BAR_HEIGHT + 15;

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

export type MovementReportItem = {
  id: string;
  inventoryName: string | null;
  type: "restock" | "adjustment" | "usage";
  changeAmount: number;
  stockRemaining: number;
  reference: string | null;
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
  { text: "Tipe", align: "center" },
  { text: "Perubahan", align: "center" },
  { text: "Stok Akhir", align: "center" },
  { text: "Referensi", align: "left" },
  { text: "Keterangan", align: "left" },
  { text: "Oleh", align: "left" },
];

const TYPE_LABELS: Record<string, string> = {
  restock: "Restock",
  adjustment: "Penyesuaian",
  usage: "Pemakaian",
};

const TYPE_COLORS: Record<string, string> = {
  restock: "#2f855a",
  adjustment: "#3182ce",
  usage: "#c53030",
};

export function generateMovementPDF(
  from: string,
  to: string,
  items: MovementReportItem[]
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
        Title: `Laporan Riwayat Stok ${from} - ${to}`,
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
        .text("LAPORAN RIWAYAT STOK", PAGE_MARGIN, 42);
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
      .text("LAPORAN RIWAYAT STOK", PAGE_MARGIN, 42);

    let y = 90;

    const metaRows: [string, string][] = [
      ["Periode Laporan", `: ${from} s/d ${to}`],
      ["Tanggal Cetak", `: ${printedAt} WIB`],
      ["Jumlah Catatan", `: ${items.length} pergerakan stok`],
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

    const descText =
      "Laporan ini menampilkan seluruh pergerakan stok inventori, mencakup restock dari supplier, " +
      "penyesuaian manual, serta pemakaian stok dari pesanan pelanggan, " +
      `selama periode ${from} hingga ${to}.`;

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
          `Dicetak otomatis oleh sistem \u2014 ${printedAt} WIB`,
          PAGE_MARGIN,
          footerY
        );

      pageFooters[pageNumber] = { y: footerY };
    };

    type ChangeDisplay = { changeStr: string; changeColor: string };

    const getChangeDisplay = ({
      type,
      changeAmount,
    }: MovementReportItem): ChangeDisplay => {
      if (type === "restock") {
        return { changeStr: `+${changeAmount}`, changeColor: "#2f855a" };
      }

      if (type === "usage") {
        return {
          changeStr: String(changeAmount),
          changeColor: changeAmount < 0 ? "#c53030" : "#2f855a",
        };
      }

      return {
        changeStr: changeAmount > 0 ? `+${changeAmount}` : String(changeAmount),
        changeColor: changeAmount > 0 ? "#2f855a" : "#c53030",
      };
    };

    const buildCells = (
      item: MovementReportItem,
      idx: number,
      change: ChangeDisplay
    ): CellDef[] => {
      const typeLabel = TYPE_LABELS[item.type] ?? item.type;
      const typeColor = TYPE_COLORS[item.type] ?? TEXT_DARK;
      return [
        { text: String(idx + 1), align: "center", color: TEXT_DARK },
        { text: item.inventoryName ?? "-", align: "left", color: TEXT_DARK },
        {
          text: typeLabel,
          align: "center",
          color: typeColor,
          bold: true,
        },
        {
          text: change.changeStr,
          align: "center",
          color: change.changeColor,
          bold: true,
        },
        {
          text: String(item.stockRemaining),
          align: "center",
          color: TEXT_DARK,
        },
        { text: item.reference ?? "-", align: "left", color: TEXT_DARK },
        { text: item.note ?? "-", align: "left", color: TEXT_DARK },
        { text: item.actorName ?? "-", align: "left", color: TEXT_DARK },
      ];
    };

    const drawCellText = (cell: CellDef, ci: number) => {
      doc
        .fillColor(cell.color ?? TEXT_DARK)
        .font(cell.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8.5)
        .text(cell.text, colX(ci) + CELL_PADDING_H, y + CELL_PADDING_TOP, {
          width: cellWidth(ci),
          align: cell.align,
        });
    };

    const drawRow = (rowCells: CellDef[], rowHeight: number, idx: number) => {
      const rowBg = idx % 2 === 0 ? "#ffffff" : LIGHT_BG;
      doc.rect(PAGE_MARGIN, y, tableWidth, rowHeight).fill(rowBg);

      doc
        .moveTo(PAGE_MARGIN, y + rowHeight)
        .lineTo(PAGE_MARGIN + tableWidth, y + rowHeight)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();

      doc.fontSize(8.5);
      rowCells.forEach(drawCellText);
    };

    const renderEmptyState = () => {
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
    };

    const renderRow = (item: MovementReportItem, idx: number) => {
      const change = getChangeDisplay(item);
      const cells = buildCells(item, idx, change);

      doc.font("Helvetica").fontSize(8.5);
      const rowHeight = computeRowHeight(cells);

      if (y + rowHeight > doc.page.height - PAGE_MARGIN - BOTTOM_SAFE_ZONE) {
        drawFooter();
        doc.addPage();
        y = drawTableHeader(TABLE_TOP);
      }

      drawRow(cells, rowHeight, idx);
      y += rowHeight;
    };

    y = drawTableHeader(y);

    if (items.length === 0) {
      renderEmptyState();
    } else {
      items.forEach(renderRow);
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
          .text(
            txt,
            pageWidth - PAGE_MARGIN - doc.widthOfString(txt),
            footer.y
          );
      }
    }

    doc.end();
  });
}
