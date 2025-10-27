import { Elysia } from "elysia";
import { betterAuth } from "@/auth-instance";
import { type GetVouchers, vouchersModel } from "./model";
import { Vouchers } from "./service";

export const vouchersController = new Elysia({ prefix: "/vouchers" })
  .use(vouchersModel)
  .use(betterAuth)
  .get(
    "/",
    async ({ status }) => {
      const result = await Vouchers.getAllVouchers();

      return status(200, {
        status: "success",
        message: "Vouchers Retrieved",
        data: result,
      });
    },
    {
      auth: true, // Requires authentication to view vouchers
    }
  )
  // Guard subsequent routes to ensure only admins can modify vouchers.
  .guard({
    isSuperAdmin: true,
  })
  .post(
    "/",
    async ({ body, status }) => {
      const newVoucherId = await Vouchers.addVoucher(body);

      return status(201, {
        status: "success",
        message: "New Voucher Created",
        data: {
          id: newVoucherId,
        },
      });
    },
    {
      body: "addVoucher",
      parse: "application/json",
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      await Vouchers.updateVoucher(id, body);

      return status(200, {
        status: "success",
        message: "Voucher updated successfully",
      });
    },
    {
      body: "updateVoucher",
      parse: "application/json",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    await Vouchers.deleteVoucher(id as string);

    return status(200, {
      status: "success",
      message: "Voucher deactivated successfully",
    });
  });
