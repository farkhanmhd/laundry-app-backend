import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { searchQueryModel } from "@/search-query";
import { posModel } from "./model";
import { Pos } from "./service";
import { NotFoundError } from "@/exceptions";

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
      messageKey: "pos.items.retrieved",
      data: result,
    });
  })
  .post(
    "/new",
    async ({ body, status, session }) => {
      try {
        const newOrderId = await Pos.newPosOrder(body, session.userId);
        return status(201, {
          status: "success",
          message: "New Pos Order Created",
          messageKey: "pos.order.created",
          data: {
            orderId: newOrderId,
          },
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Resource not found",
            messageKey: "common.notFound",
          });
        }
        throw error;
      }
    },
    {
      body: "newPosOrderSchema",
      parse: "application/json",
      isAdmin: true,
    }
  )
  .get(
    "/members",
    async ({ status, query }) => {
      const members = await Pos.getPosMembers(query);
      return status(200, {
        status: "success",
        message: "Member search success",
        messageKey: "pos.members.retrieved",
        data: { members },
      });
    },
    {
      query: "searchQuery",
      isAdmin: true,
    }
  )
  .get(
    "/vouchers",
    async ({ status }) => {
      const data = await Pos.getPosVouchers();

      return status(200, {
        status: "success",
        message: "Pos Vouchers Retrieved",
        messageKey: "pos.vouchers.retrieved",
        data,
      });
    },
    {
      auth: true,
    }
  )
  .get(
    "/voucher",
    async ({ status, query }) => {
      try {
        const { search = "" } = query;
        const voucher = await Pos.getVoucherByCode(search.toLowerCase());
        return status(200, {
          status: "success",
          message: "Voucher Added",
          messageKey: "pos.voucher.retrieved",
          data: voucher,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Voucher not found",
            messageKey: "pos.voucher.notFound",
          });
        }
        throw error;
      }
    },
    {
      query: "searchQuery",
      auth: true,
    }
  );
