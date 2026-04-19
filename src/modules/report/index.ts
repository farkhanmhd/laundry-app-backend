// src/modules/report/index.ts
//
// Unified report controller — all PDF report endpoints live here.
// Register in server.ts:
//   import { reportController } from "./modules/report";
//   .use(reportController)
//
// Install: bun add pdfkit && bun add -d @types/pdfkit

import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { dateRangeQuery } from "@/utils";
import { generateBestSellersPDF } from "./best-sellers";
import { generateAdjustmentPDF } from "./inventory-adjustments";
import { generateRestockPDF } from "./inventory-restock";
import { generateUsagePDF } from "./inventory-usage";
import { generateMemberSpendingPDF } from "./member-spending";
import { generateSalesByOrderPDF } from "./sales-by-order";
import { ReportService } from "./service";

export const reportController = new Elysia({ prefix: "/report" })
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Reports"],
    },
    isSuperAdmin: true,
  })
  // ─── Sales: Best Sellers ───────────────────────────────────────────────────
  .get(
    "/sales/best-sellers",
    async ({ query, set }) => {
      const { from, to } = query;

      const items = await ReportService.getBestSellersForReport(from, to);
      const pdfBuffer = await generateBestSellersPDF(from, to, items);

      const filename = `laporan-produk-terlaris_${from}_sd_${to}.pdf`;

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    },
    {
      detail: {
        description:
          "Menghasilkan laporan PDF produk terlaris berdasarkan rentang tanggal.",
      },
      query: dateRangeQuery,
    }
  )
  // ─── Sales: By Order ───────────────────────────────────────────────────────
  .get(
    "/sales/by-order",
    async ({ query, set }) => {
      const { from, to } = query;

      const items = await ReportService.getSalesByOrderForReport(from, to);
      const pdfBuffer = await generateSalesByOrderPDF(from, to, items);

      const filename = `laporan-penjualan-per-pesanan_${from}_sd_${to}.pdf`;

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    },
    {
      detail: {
        description:
          "Menghasilkan laporan PDF penjualan per pesanan berdasarkan rentang tanggal.",
      },
      query: dateRangeQuery,
    }
  )
  // ─── Inventory: Adjustments ────────────────────────────────────────────────
  .get(
    "/inventory/adjustments",
    async ({ query, set }) => {
      const { from, to } = query;

      const items = await ReportService.getAdjustmentHistoryForReport(from, to);
      const pdfBuffer = await generateAdjustmentPDF(from, to, items);

      const filename = `laporan-penyesuaian-stok_${from}_sd_${to}.pdf`;

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    },
    {
      detail: {
        description:
          "Menghasilkan laporan PDF penyesuaian stok inventori manual berdasarkan rentang tanggal.",
      },
      query: dateRangeQuery,
    }
  )
  // ─── Inventory: Usage ──────────────────────────────────────────────────────
  .get(
    "/inventory/usage",
    async ({ query, set }) => {
      const { from, to } = query;

      const items = await ReportService.getUsageHistoryForReport(from, to);
      const pdfBuffer = await generateUsagePDF(from, to, items);

      const filename = `laporan-penggunaan-inventori_${from}_sd_${to}.pdf`;

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    },
    {
      detail: {
        description:
          "Menghasilkan laporan PDF penggunaan inventori dari pesanan berdasarkan rentang tanggal.",
      },
      query: dateRangeQuery,
    }
  )
  // ─── Inventory: Restock ────────────────────────────────────────────────────
  .get(
    "/inventory/restock",
    async ({ query, set }) => {
      const { from, to } = query;

      const items = await ReportService.getRestockHistoryForReport(from, to);
      const pdfBuffer = await generateRestockPDF(from, to, items);

      const filename = `laporan-restock-inventori_${from}_sd_${to}.pdf`;

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    },
    {
      detail: {
        description:
          "Menghasilkan laporan PDF restock inventori dari supplier berdasarkan rentang tanggal.",
      },
      query: dateRangeQuery,
    }
  )
  // ─── Members: Spending ─────────────────────────────────────────────────────
  .get(
    "/member/spending",
    async ({ query, set }) => {
      const { from, to, rows } = query;

      const items = await ReportService.getMembersWithSpendingForReport(
        from,
        to,
        rows
      );
      const pdfBuffer = await generateMemberSpendingPDF(from, to, items);

      const filename = `laporan-pengeluaran-member_${from}_sd_${to}.pdf`;

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    },
    {
      detail: {
        description:
          "Menghasilkan laporan PDF pengeluaran member berdasarkan rentang tanggal.",
      },
      query: t.Composite([
        dateRangeQuery,
        t.Object({
          rows: t.Optional(t.Numeric()),
        }),
      ]),
    }
  );

// Future reports — add more .get() routes here, e.g.:
// .get("/sales/by-order", ...)
// .get("/inventory/usage", ...)
// .get("/members/spending", ...)
