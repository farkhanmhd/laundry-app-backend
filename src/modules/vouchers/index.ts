import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
import { searchQueryModel } from "@/search-query";
import { vouchersModel } from "./model";
import { Vouchers } from "./service";

export const vouchersController = new Elysia({ prefix: "/vouchers" })
  .use(vouchersModel)
  .use(searchQueryModel)
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Voucher"],
    },
  })
  .get("/visible", async ({ status }) => {
    const vouchers = await Vouchers.getVisibleVouchers();
    return status(200, {
      status: "success",
      message: "Vouchers Retrieved",
      messageKey: "voucher.retrieved",
      data: { vouchers },
    });
  })
  .get(
    "/",
    async ({ query, status }) => {
      try {
        const result = await Vouchers.getAllVouchers(query);

        return status(200, {
          status: "success",
          message: "Vouchers Retrieved",
          messageKey: "voucher.retrieved",
          data: result.data,
          totalData: result.totalData,
          totalPages: result.totalPages,
        });
      } catch (error) {
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      auth: true,
      query: "vouchersQuery",
    }
  )
  .get(
    "/:id",
    async ({ params, status }) => {
      try {
        const voucher = await Vouchers.getVoucherById(params.id as string);

        return status(200, {
          status: "success",
          message: "Voucher Retrieved",
          messageKey: "voucher.retrieved",
          data: voucher,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "voucher.notFound",
            messageParams: { id: params.id },
            data: null,
          });
        }
        throw error;
      }
    },
    { auth: true }
  )
  .guard({
    isSuperAdmin: true,
  })
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const newVoucherId = await Vouchers.addVoucher(body);

        return status(201, {
          status: "success",
          message: "New Voucher Created",
          messageKey: "voucher.created",
          messageParams: { code: body.code },
          data: {
            id: newVoucherId,
          },
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          return status(409, {
            status: "error",
            message: error.message,
            messageKey: "voucher.codeTaken",
            messageParams: { code: body.code },
            data: null,
          });
        }
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "voucherInsert",
      parse: "application/json",
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await Vouchers.updateVoucher(id, body);

        return status(200, {
          status: "success",
          message: "Voucher updated successfully",
          messageKey: "voucher.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "voucher.notFound",
            messageParams: { id },
            data: null,
          });
        }
        if (error instanceof ConflictError) {
          return status(409, {
            status: "error",
            message: error.message,
            messageKey: "voucher.codeTaken",
            messageParams: { code: body.code },
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "voucherInsert",
      parse: "application/json",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    try {
      await Vouchers.deleteVoucher(id as string);

      return status(200, {
        status: "success",
        message: "Voucher deactivated successfully",
        messageKey: "voucher.deleted",
        data: null,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "voucher.notFound",
          messageParams: { id },
          data: null,
        });
      }
      throw error;
    }
  });
