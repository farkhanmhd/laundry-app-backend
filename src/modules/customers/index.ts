import { Elysia } from "elysia";
import { betterAuth } from "@/auth-instance";
import { customersModel } from "./model";
import { Customers } from "./service";

export const customerController = new Elysia({ prefix: "/customers" })
  .use(betterAuth)
  .use(customersModel)
  .get(
    "/",
    async ({ status }) => {
      const result = await Customers.getCustomers();

      return status(200, {
        status: "success",
        message: "Customers Retrieved",
        data: result,
      });
    },
    {
      auth: true,
    },
  )
  .post(
    "/",
    async ({ body, status }) => {
      const newCustomerId = await Customers.addCustomer(body);

      return status(201, {
        status: "success",
        message: "New Customer Added",
        data: {
          id: newCustomerId,
        },
      });
    },
    {
      auth: true,
      body: "addCustomer",
      parse: "application/json",
    },
  );
