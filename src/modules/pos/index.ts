import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { searchQueryModel } from "@/search-query";
import { posModel } from "./model";
import { Pos } from "./service";

export const posController = new Elysia({ prefix: "/pos" })
  .use(posModel)
  .use(betterAuth)
  .use(searchQueryModel)
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
  )
  .get(
    "/members",
    async ({ status, query }) => {
      const members = await Pos.getPosMembers(query);
      return status(200, {
        status: "success",
        message: "Member search success",
        data: { members },
      });
    },
    {
      query: "searchQuery",
    }
  )
  .get("/vouchers", async ({ status }) => {
    const data = await Pos.getPosVouchers();

    return status(200, {
      status: "success",
      message: "Pos Vouchers Retrieved",
      data,
    });
  });
