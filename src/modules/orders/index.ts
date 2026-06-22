import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { NotFoundError } from "@/exceptions";
import { midtransModel } from "../midtrans/model";
import { ordersModel } from "./model";
import { Orders } from "./service";

export const ordersController = new Elysia({ prefix: "/orders" })
  .use(betterAuth)
  .use(ordersModel)
  .use(midtransModel)
  .guard({
    tags: ["Orders"],
  })
  .ws("/payment/:id", {
    params: t.Object({
      id: t.String(),
    }),
    open(ws) {
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

      if (data.updated) {
        const orderId = body.order_id;

        await Orders.reduceQtyAfterPayment(orderId);
        await Orders.handlePointsAfterPayment(orderId);

        const socketData = {
          type: "PAYMENT_UPDATE",
          orderId,
          status: body.status_message,
          ...data,
        };

        server?.publish(`payment/${body.order_id}`, JSON.stringify(socketData));
      }

      return status(200, {
        status: "success",
        message: "Notification Received",
        messageKey: "order.notification.received",
        data,
      });
    },
    {
      parse: "application/json",
      body: "midtransNotification",
    }
  )
  .get(
    "/",
    async ({ status, query }) => {
      const orders = await Orders.getOrders(query);
      return status(200, {
        status: "success",
        message: "Orders Retrieved",
        messageKey: "order.retrieved",
        data: orders,
      });
    },
    {
      query: "ordersQuery",
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
      try {
        const orderStatus = await Orders.getOrderStatus(params.id);

        return status(200, {
          status: "success",
          message: "Order Status Retrieved",
          messageKey: "order.status.retrieved",
          data: orderStatus,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Order not found",
            messageKey: "order.notFound",
          });
        }
        throw error;
      }
    },
    {
      isAdmin: true,
    }
  )
  .patch(
    "/:id/status",
    async ({ status, params }) => {
      try {
        const result = await Orders.updateOrderStatus(params.id);

        return status(200, {
          status: "success",
          message: "Order Status Updated",
          messageKey: "order.status.updated",
          data: result,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Order not found",
            messageKey: "order.notFound",
          });
        }
        throw error;
      }
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/:id/items",
    async ({ status, params }) => {
      try {
        const orderItems = await Orders.getOrderItems(params.id);

        return status(200, {
          status: "success",
          message: "Order Items Retrieved",
          messageKey: "order.items.retrieved",
          data: orderItems,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Order not found",
            messageKey: "order.notFound",
          });
        }
        throw error;
      }
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/:id/payment",
    async ({ status, params }) => {
      try {
        const payment = await Orders.getOrderPayment(params.id);

        return status(200, {
          status: "success",
          message: "Order Payment Retrieved",
          messageKey: "order.payment.retrieved",
          data: payment,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Order not found",
            messageKey: "order.notFound",
          });
        }
        throw error;
      }
    },
    {
      isAdmin: true,
    }
  )
  .get(
    "/:id/customer",
    async ({ status, params }) => {
      try {
        const customer = await Orders.getOrdercustomer(params.id);

        return status(200, {
          status: "success",
          message: "Order Customer Retrieved",
          messageKey: "order.customer.retrieved",
          data: customer,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Order not found",
            messageKey: "order.notFound",
          });
        }
        throw error;
      }
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
        messageKey: "order.deliveries.retrieved",
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
      try {
        const paymentDetails = await Orders.getOrderPaymentDetails(params.id);

        return status(200, {
          status: "success",
          message: "Order Payment Details Retrieved",
          messageKey: "order.paymentDetails.retrieved",
          data: paymentDetails,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: "Payment details not found",
            messageKey: "order.paymentDetails.notFound",
          });
        }
        throw error;
      }
    },
    {
      isAdmin: true,
    }
  );
