import { Elysia, t } from "elysia";
import { succesResponse } from "@/responses";

const transactionTypeEnum = t.Union([t.Literal("on-us"), t.Literal("off-us")]);

const transactionStatusEnum = t.Union([
  t.Literal("capture"),
  t.Literal("settlement"),
  t.Literal("pending"),
  t.Literal("deny"),
  t.Literal("expire"),
  t.Literal("cancel"),
]);

const paymentTypeEnum = t.Union([
  t.Literal("qris"),
  t.Literal("gopay"),
  t.Literal("bank_transfer"),
  t.Literal("credit_card"),
]);

const fraudStatusEnum = t.Union([
  t.Literal("accept"),
  t.Literal("deny"),
  t.Literal("pending"),
]);

export const midtransNotification = t.Object({
  transaction_type: transactionTypeEnum,
  transaction_time: t.String(),
  transaction_status: transactionStatusEnum,
  transaction_id: t.String(),
  status_message: t.String(),
  status_code: t.String(),
  signature_key: t.String(),
  settlement_time: t.Optional(t.String()),
  pop_id: t.String(),
  payment_type: paymentTypeEnum,
  order_id: t.String(),
  merchant_id: t.String(),
  merchant_cross_reference_id: t.Optional(t.String()),
  issuer: t.Optional(t.String()),
  gross_amount: t.String(),
  fraud_status: fraudStatusEnum,
  expiry_time: t.String(),
  customer_details: t.Record(t.String(), t.Any()),
  currency: t.String(),
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
