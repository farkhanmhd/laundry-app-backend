import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { generateReceiptPDF } from "./receipt-pdf";
import { ReceiptService } from "./service";

export const receiptController = new Elysia({ prefix: "/receipt" })
  .use(betterAuth)
  .guard({
    tags: ["Receipt"],
  })
  .get(
    "/lookup",
    async ({ query }) => {
      const result = await ReceiptService.lookup(query.orderId);
      return {
        status: "success",
        data: result,
      };
    },
    {
      query: t.Object({
        orderId: t.String(),
      }),
    }
  )
  .group("/:id", (app) =>
    app
      .get("/info", async ({ params }) => {
        const result = await ReceiptService.getInfo(params.id);
        return {
          status: "success",
          data: result,
        };
      })
      .get("/customer", async ({ params }) => {
        const result = await ReceiptService.getCustomer(params.id);
        return {
          status: "success",
          data: result,
        };
      })
      .get("/deliveries", async ({ params }) => {
        const result = await ReceiptService.getDeliveries(params.id);
        return {
          status: "success",
          data: result,
        };
      })
      .get("/payment", async ({ params }) => {
        const result = await ReceiptService.getPayment(params.id);
        return {
          status: "success",
          data: result,
        };
      })
      .get("/items", async ({ params }) => {
        const result = await ReceiptService.getItems(params.id);
        return {
          status: "success",
          data: result,
        };
      })
      .get(
        "/pdf",
        async ({ params, set }) => {
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
        },
        {
          detail: {
            description: "Generate a receipt PDF for a given order.",
          },
          isAdmin: true,
        }
      )
      .get(
        "/customer-pdf",
        async ({ params, set, user }) => {
          await ReceiptService.verifyCustomerOrderOwnership(params.id, user.id);
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
        },
        {
          detail: {
            description: "Generate a receipt PDF for the customer's own order.",
          },
          isCustomer: true,
        }
      )
  );
