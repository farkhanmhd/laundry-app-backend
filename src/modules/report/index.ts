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
import { generateBestSellersPDF } from "./best-sellers";
import { ReportService } from "./service";

const dateRangeQuery = t.Object({
  from: t.String({
    pattern: "^\\d{2}-\\d{2}-\\d{4}$",
    error: "Tanggal harus dalam format dd-MM-yyyy",
  }),
  to: t.String({
    pattern: "^\\d{2}-\\d{2}-\\d{4}$",
    error: "Tanggal harus dalam format dd-MM-yyyy",
  }),
});

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
  );

// Future reports — add more .get() routes here, e.g.:
// .get("/sales/by-order", ...)
// .get("/inventory/usage", ...)
// .get("/members/spending", ...)
