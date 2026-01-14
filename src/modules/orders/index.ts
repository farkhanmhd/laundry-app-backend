import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { Orders } from "./service";

export const ordersController = new Elysia({ prefix: "/orders" })
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Orders"],
    },
    isAdmin: true,
  })
  .get("/", async ({ status }) => {
    const orders = await Orders.getOrders();
    return status(201, {
      status: "success",
      message: "Orders Retrieved",
      data: orders,
    });
  })
  .get("/:id/status", async ({ status, params }) => {
    const orderStatus = await Orders.getOrderStatus(params.id);

    return status(200, {
      status: "success",
      message: "Order Status Retrieved",
      data: orderStatus,
    });
  })
  .get("/:id/items", async ({ status, params }) => {
    const orderItems = await Orders.getOrderItems(params.id);

    return status(200, {
      status: "success",
      message: "Order Items Retrieved",
      data: orderItems,
    });
  })
  .get("/:id/payment", async ({ status, params }) => {
    const payment = await Orders.getOrderPayment(params.id);

    return status(200, {
      status: "success",
      message: "Order Payment Retrieved",
      data: payment,
    });
  })
  .get("/:id/customer", async ({ status, params }) => {
    const customer = await Orders.getOrdercustomer(params.id);

    return status(200, {
      status: "success",
      message: "Order Customer Retrieved",
      data: customer,
    });
  })
  .get("/:id/deliveries", async ({ status, params }) => {
    const deliveries = await Orders.getOrderDeliveries(params.id);

    return status(200, {
      status: "success",
      message: "Order Deliveries Retrieved",
      data: deliveries,
    });
  });
