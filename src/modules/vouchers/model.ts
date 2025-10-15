import { Elysia, t } from "elysia";
import { models } from "@/db/models";
import { succesResponse } from "@/responses";

// Base schema for a single voucher, derived from the database select model.
const voucher = t.Object(models.select.vouchers);

// Schema for creating a new voucher with validation rules.
const addVoucher = t.Object({
  code: t.String({
    ...models.insert.vouchers.code,
    minLength: 3,
    error: "Voucher code must be at least 3 characters",
  }),
  name: t.String({
    ...models.insert.vouchers.name,
    minLength: 3,
    error: "Voucher name must be at least 3 characters long.",
  }),
  pointsCost: t.Numeric({
    ...models.insert.vouchers.pointsCost,
    minimum: 0,
    error: "Points cost cannot be negative.",
  }),
  discountAmount: t.Numeric({
    ...models.insert.vouchers.discountAmount,
    minimum: 1,
    error: "Discount amount must be a positive number.",
  }),
  expiresAt: t.String({
    ...models.insert.vouchers.expiresAt,
    error: "Expire date required",
  }),
});

// Schema for updating an existing voucher. All fields are optional.
const updateVoucher = t.Partial(addVoucher);

// TypeScript types inferred from the schemas.
export type AddVoucherBody = typeof addVoucher.static;
export type UpdateVoucherBody = typeof updateVoucher.static;

// Response schema for a successful voucher creation.
const addVoucherResponse = t.Composite([
  succesResponse,
  t.Object({
    data: t.Pick(voucher, ["id"]),
  }),
]);

// Response schema for retrieving a list of vouchers.
const getVouchers = t.Composite([
  succesResponse,
  t.Object({
    data: t.Array(voucher),
  }),
]);

export type GetVouchers = typeof getVouchers.static;

// Elysia model plugin to register all voucher-related schemas.
export const vouchersModel = new Elysia({ name: "vouchers/model" }).model({
  addVoucher,
  updateVoucher,
  addVoucherResponse,
  getVouchers,
});
