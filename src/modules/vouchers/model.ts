import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";
import { searchQuery } from "@/search-query";

const voucher = t.Object(models.select.vouchers);
const voucherInsert = t.Object(models.insert.vouchers);

export type Voucher = typeof voucher.static;
export type VoucherInsert = typeof voucherInsert.static;

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

export const vouchersQuery = t.Composite([
  searchQuery,
  t.Object({
    visibility: t.Optional(
      t.Array(t.Union([t.Literal("true"), t.Literal("false")]))
    ),
    type: t.Optional(
      t.Array(t.Union([t.Literal("percentage"), t.Literal("fixed")]))
    ),
  }),
]);

export type VouchersQuery = typeof vouchersQuery.static;
export type GetVouchers = typeof getVouchers.static;

export const vouchersModel = new Elysia({ name: "vouchers/model" }).model({
  voucherInsert,
  addVoucherResponse,
  getVouchers,
  vouchersQuery,
});
