import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";

const voucher = t.Object(models.select.vouchers);
const addVoucher = t.Object(models.insert.vouchers);
const updateVoucher = t.Partial(addVoucher);

export type Voucher = typeof voucher.static;
export type AddVoucherBody = typeof addVoucher.static;
export type UpdateVoucherBody = typeof updateVoucher.static;

const addVoucherResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Pick(voucher, ["id"]),
  }),
]);

const getVouchers = t.Composite([
  succesResponse,
  t.Object({
    data: t.Array(voucher),
  }),
]);

export type GetVouchers = typeof getVouchers.static;

export const vouchersModel = new Elysia({ name: "vouchers/model" }).model({
  addVoucher,
  updateVoucher,
  addVoucherResponse,
  getVouchers,
});
