import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { posModel } from "./model";
import { Pos } from "./service";

export const posController = new Elysia({ prefix: "/pos" })
  .use(posModel)
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Pos"],
    },
  })
  .get("/", async ({ status }) => {
    const result = await Pos.getPosItems();

    return status(200, {
      status: "success",
      message: "Pos Items Retrieved",
      data: result,
    });
  })
  .guard({
    isAdmin: true,
  })
  .post(
    "/new",
    async ({ body, status, session }) => {
      const newOrderId = await Pos.newPosOrder(body, session.userId);
      return status(201, {
        status: "success",
        message: "New Pos Order Created",
        data: {
          orderId: newOrderId,
        },
      });
    },
    {
      body: "newPosOrderSchema",
      parse: "application/json",
    }
  );
