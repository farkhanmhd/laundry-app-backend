import { Elysia, t } from "elysia";
import { ReceiptService } from "./service";

export const receiptController = new Elysia({ prefix: "/receipt" })
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
  );
