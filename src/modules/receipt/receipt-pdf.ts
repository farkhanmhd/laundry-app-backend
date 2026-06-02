import PDFDocument from "pdfkit";

const BLACK = "#000000";
const GRAY_DARK = "#666666";
const GRAY_LIGHT = "#999999";

const PAGE_WIDTH = 284;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE = 9;
const FONT_SIZE_HEADER = 13;
const FONT_SIZE_SMALL = 7.5;
const LINE_HEIGHT = 14;

export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

export type ReceiptData = {
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

const formatIDR = (n: number): string => {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
};

const divider = (doc: PDFKit.PDFDocument, y: number, char = "-"): number => {
  const lineY = y + 6;
  doc
    .moveTo(MARGIN, lineY)
    .lineTo(PAGE_WIDTH - MARGIN, lineY)
    .strokeColor(char === "=" ? BLACK : GRAY_LIGHT)
    .lineWidth(char === "=" ? 0.5 : 0.5)
    .stroke();
  return y + LINE_HEIGHT;
};

const drawHeader = (
  doc: PDFKit.PDFDocument,
  data: ReceiptData,
  startY: number
): number => {
  let y = startY;

  doc
    .fillColor(BLACK)
    .font("Helvetica-Bold")
    .fontSize(FONT_SIZE_HEADER)
    .text("BERINGIN COIN LAUNDRY", MARGIN, y, {
      align: "center",
      width: CONTENT_WIDTH,
    });
  y += 20;

  doc
    .fillColor(GRAY_DARK)
    .font("Helvetica")
    .fontSize(FONT_SIZE_SMALL)
    .text(
      "Jl. Beringin Ps. VII No.98, Hutan, Kec. Percut Sei Tuan, Kabupaten Deli Serdang, Sumatera Utara 20371",
      MARGIN,
      y,
      {
        align: "center",
        width: CONTENT_WIDTH,
      }
    );
  y += 24;
  doc.text("Telp: 0812-6060-3269", MARGIN, y, {
    align: "center",
    width: CONTENT_WIDTH,
  });
  y += 16;

  y = divider(doc, y, "=");

  doc
    .fillColor(BLACK)
    .font("Helvetica")
    .fontSize(FONT_SIZE)
    .text(`Order    : ${data.orderId}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Date     : ${formatDate(data.createdAt)}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(
    `Status   : ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
    MARGIN,
    y
  );
  y += LINE_HEIGHT + 2;

  return y;
};

const drawCustomerInfo = (
  doc: PDFKit.PDFDocument,
  data: ReceiptData,
  startY: number
): number => {
  let y = startY;
  y = divider(doc, y);

  doc
    .fillColor(BLACK)
    .font("Helvetica")
    .fontSize(FONT_SIZE)
    .text(`Customer : ${data.customerName}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Phone    : ${data.phone}`, MARGIN, y);
  y += LINE_HEIGHT;
  if (data.memberId) {
    doc.text(`Member   : ${data.memberId}`, MARGIN, y);
    y += LINE_HEIGHT;
  }

  return y;
};

const drawItemsTable = (
  doc: PDFKit.PDFDocument,
  data: ReceiptData,
  startY: number
): number => {
  let y = startY;
  y = divider(doc, y);

  const colQty = 22;
  const colPrice = 65;
  const colSubtotal = 65;
  const colName = CONTENT_WIDTH - colQty - colPrice - colSubtotal;

  doc.fillColor(GRAY_DARK).font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL);
  let x = MARGIN;
  doc.text("Qty", x, y + 1, { width: colQty, align: "center" });
  x += colQty;
  doc.text("Item", x, y + 1, { width: colName, align: "left" });
  x += colName;
  doc.text("Price", x, y + 1, { width: colPrice, align: "right" });
  x += colPrice;
  doc.text("Total", x, y + 1, { width: colSubtotal, align: "right" });
  y += LINE_HEIGHT;

  const lineY = y - 2;
  doc
    .moveTo(MARGIN, lineY)
    .lineTo(PAGE_WIDTH - MARGIN, lineY)
    .strokeColor(BLACK)
    .lineWidth(0.5)
    .stroke();
  y += 4;

  for (const item of data.items) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = MARGIN;
    }

    const priceStr = formatIDR(item.price);
    const subtotalStr = formatIDR(item.subtotal);

    doc.fillColor(BLACK).font("Helvetica").fontSize(FONT_SIZE);

    let cx = MARGIN;
    doc.text(String(item.qty), cx, y + 1, {
      width: colQty,
      align: "center",
    });
    cx += colQty;
    doc.text(item.name, cx, y + 1, { width: colName, align: "left" });
    cx += colName;
    doc.text(priceStr, cx, y + 1, { width: colPrice, align: "right" });
    cx += colPrice;
    doc.text(subtotalStr, cx, y + 1, { width: colSubtotal, align: "right" });
    y += LINE_HEIGHT;

    if (item.name.length > 22) {
      y += 2;
    }
  }

  return y;
};

const drawTotals = (
  doc: PDFKit.PDFDocument,
  data: ReceiptData,
  startY: number
): number => {
  let y = startY + 2;

  const drawTotalRow = (
    label: string,
    value: string,
    isBold = false,
    isGray = false
  ) => {
    doc
      .fillColor(isGray ? GRAY_DARK : BLACK)
      .font(isBold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(FONT_SIZE)
      .text(label, MARGIN, y, { width: CONTENT_WIDTH * 0.6, align: "left" })
      .text(value, MARGIN, y, { width: CONTENT_WIDTH, align: "right" });
    y += LINE_HEIGHT;
  };

  const lineY = y - 4;
  doc
    .moveTo(MARGIN, lineY)
    .lineTo(PAGE_WIDTH - MARGIN, lineY)
    .strokeColor(GRAY_LIGHT)
    .lineWidth(0.5)
    .stroke();
  y += 2;

  drawTotalRow("Subtotal", formatIDR(data.subtotal));

  if (data.voucher) {
    const desc = data.voucher.code ? `Voucher ${data.voucher.code}` : "Voucher";
    drawTotalRow(
      desc,
      `-${formatIDR(data.voucher.discountAmount)}`,
      false,
      true
    );
  }

  if (data.points) {
    drawTotalRow("Points", `-${formatIDR(data.points)}`, false, true);
  }

  const lineY2 = y - 2;
  doc
    .moveTo(MARGIN, lineY2)
    .lineTo(PAGE_WIDTH - MARGIN, lineY2)
    .strokeColor(BLACK)
    .lineWidth(1)
    .stroke();
  y += 2;

  drawTotalRow("TOTAL", formatIDR(data.grandTotal), true);

  return y;
};

const drawPayment = (
  doc: PDFKit.PDFDocument,
  data: ReceiptData,
  startY: number
): number => {
  let y = startY + 2;

  const formatPaymentLabel = (t: string): string => {
    if (t === "cash") {
      return "Cash";
    }
    if (t === "qris") {
      return "QRIS";
    }
    return t || "N/A";
  };
  const paymentLabel = formatPaymentLabel(data.paymentType);

  doc
    .fillColor(BLACK)
    .font("Helvetica")
    .fontSize(FONT_SIZE)
    .text(paymentLabel, MARGIN, y, {
      width: CONTENT_WIDTH * 0.5,
      align: "left",
    })
    .text(formatIDR(data.amountPaid), MARGIN, y, {
      width: CONTENT_WIDTH,
      align: "right",
    });
  y += LINE_HEIGHT;

  if (data.paymentType === "cash" && data.change > 0) {
    doc
      .fillColor(GRAY_DARK)
      .font("Helvetica")
      .fontSize(FONT_SIZE)
      .text("Change", MARGIN, y, { width: CONTENT_WIDTH * 0.5, align: "left" })
      .text(formatIDR(data.change), MARGIN, y, {
        width: CONTENT_WIDTH,
        align: "right",
      });
    y += LINE_HEIGHT;
  }

  return y;
};

const drawFooter = (
  doc: PDFKit.PDFDocument,
  _data: ReceiptData,
  startY: number
): number => {
  let y = divider(doc, startY, "-");
  y += 4;

  const printedAt = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  doc
    .fillColor(BLACK)
    .font("Helvetica")
    .fontSize(FONT_SIZE)
    .text("Terima kasih telah menggunakan", MARGIN, y, {
      align: "center",
      width: CONTENT_WIDTH,
    });
  y += 13;
  doc.text("jasa laundry kami!", MARGIN, y, {
    align: "center",
    width: CONTENT_WIDTH,
  });
  y += 18;

  doc
    .fillColor(GRAY_LIGHT)
    .font("Helvetica")
    .fontSize(FONT_SIZE_SMALL)
    .text(`Printed: ${printedAt} WIB`, MARGIN, y, {
      align: "center",
      width: CONTENT_WIDTH,
    });
  y += 14;

  return y;
};

export function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, 600],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `Receipt ${data.orderId}`,
        Author: "Beringin Coin Laundry",
        Subject: "Order Receipt",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const sections = [
      drawHeader,
      drawCustomerInfo,
      drawItemsTable,
      drawTotals,
      drawPayment,
      drawFooter,
    ];

    let y = MARGIN;
    for (const section of sections) {
      y = section(doc, data, y);
      y += 2;
    }

    doc.end();
  });
}
