import { Elysia, t } from "elysia";
import { succesResponse } from "@/responses";

export const transactionTypeEnum = t.Union([
  t.Literal("on-us"),
  t.Literal("off-us"),
]);

export const transactionStatusEnum = t.Union([
  t.Literal("capture"),
  t.Literal("settlement"),
  t.Literal("pending"),
  t.Literal("deny"),
  t.Literal("expire"),
  t.Literal("cancel"),
]);

export const paymentTypeEnum = t.Union([
  t.Literal("qris"),
  t.Literal("gopay"),
  t.Literal("bank_transfer"),
  t.Literal("credit_card"),
]);

export const fraudStatusEnum = t.Union([
  t.Literal("accept"),
  t.Literal("deny"),
  t.Literal("pending"),
]);

export const midtransNotification = t.Object({
  transaction_type: t.Optional(t.String()),
  transaction_time: t.Optional(t.String()),
  transaction_status: t.Optional(t.String()),
  transaction_id: t.Optional(t.String()),
  status_message: t.Optional(t.String()),
  status_code: t.Optional(t.String()),
  signature_key: t.Optional(t.String()),
  settlement_time: t.Optional(t.String()),
  payment_type: t.Optional(t.String()),
  order_id: t.String(),
  merchant_id: t.Optional(t.String()),
  merchant_cross_reference_id: t.Optional(t.String()),
  issuer: t.Optional(t.String()),
  gross_amount: t.Optional(t.String()),
  fraud_status: t.Optional(t.String()),
  expiry_time: t.Optional(t.String()),
  currency: t.Optional(t.String()),
  acquirer: t.Optional(t.String()),
});

export type MidtransNotification = typeof midtransNotification.static;

const midtransNotificationResponse = t.Composite([
  succesResponse,
  t.Object({
    data: midtransNotification,
  }),
]);

export type MidtransNotificationResponse =
  typeof midtransNotificationResponse.static;

export const midtransModel = new Elysia({ name: "midtrans/model" }).model({
  midtransNotification,
  midtransNotificationResponse,
});
