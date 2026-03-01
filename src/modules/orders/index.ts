import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { searchQueryModel } from "@/search-query";
import { midtransModel } from "../midtrans/model";
import { Orders } from "./service";

export const ordersController = new Elysia({ prefix: "/orders" })
  .use(betterAuth)
  .use(searchQueryModel)
  .use(midtransModel)
  .ws("/payment/:id", {
    params: t.Object({
      id: t.String(),
    }),
    open(ws) {
      // The client joins a "room" or "topic" based on the order ID
      ws.subscribe(`payment/${ws.data.params.id}`);
      console.log(`Client subscribed to order: ${ws.data.params.id}`);
    },
    close(ws) {
      ws.unsubscribe(`payment/${ws.data.params.id}`);
    },
  })
  .post(
    "/notification",
    async ({ status, body, server }) => {
      const data = await Orders.handleMidtransNotification(body);

      if (!data.result) {
        throw new Error("Payment details not found");
      }

      const socketData = {
        type: "PAYMENT_UPDATE",
        orderId: body.order_id,
        status: body.status_message,
        ...data,
      };

      server?.publish(`payment/${body.order_id}`, JSON.stringify(socketData));

      return status(200, {
        status: "success",
        message: "Notification Received",
        data,
      });
    },
    {
      parse: "application/json",
      body: "midtransNotification",
    }
  )
  .guard({
    detail: {
      tags: ["Orders"],
    },
  })
  .get(
    "/",
    async ({ status, query }) => {
      const orders = await Orders.getOrders(query);
      return status(200, {
        status: "success",
        message: "Orders Retrieved",
        data: orders,
      });
    },
    {
      query: "searchQuery",
      isAdmin: true,
    }
  )
  .guard({
    params: t.Object({
      id: t.String(),
    }),
  })
  .get(
    "/:id/status",
    async ({ status, params }) => {
      const orderStatus = await Orders.getOrderStatus(params.id);

      return status(200, {
        status: "success",
        message: "Order Status Retrieved",
        data: orderStatus,
      });
    },
    {
      isAdmin: true,
    }
  )

  .get(
    "/:id/items",
    async ({ status, params }) => {
      const orderItems = await Orders.getOrderItems(params.id);

      return status(200, {
        status: "success",
        message: "Order Items Retrieved",
        data: orderItems,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/:id/payment",
    async ({ status, params }) => {
      const payment = await Orders.getOrderPayment(params.id);

      return status(200, {
        status: "success",
        message: "Order Payment Retrieved",
        data: payment,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/:id/customer",
    async ({ status, params }) => {
      const customer = await Orders.getOrdercustomer(params.id);

      return status(200, {
        status: "success",
        message: "Order Customer Retrieved",
        data: customer,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/:id/deliveries",
    async ({ status, params }) => {
      const deliveries = await Orders.getOrderDeliveries(params.id);

      return status(200, {
        status: "success",
        message: "Order Deliveries Retrieved",
        data: deliveries,
      });
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/:id/payment_details",
    async ({ status, params }) => {
      const paymentDetails = await Orders.getOrderPaymentDetails(params.id);

      return status(200, {
        status: "success",
        message: "Order Payment Details Retrieved",
        data: paymentDetails,
      });
    },
    {
      isAdmin: true,
    }
  );
