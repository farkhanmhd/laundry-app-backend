import { Elysia, t } from "elysia";

const addCustomer = t.Object({
  name: t.String({
    minLength: 1,
    error: "Customer name cannot be empty",
  }),
  phone: t.String({
    minLength: 6,
    error: "Phone number should be at least 6 character",
  }),
});

export type AddCustomerBody = typeof addCustomer.static;

export const customersModel = new Elysia({ name: "customers/model" }).model({
  addCustomer,
});
