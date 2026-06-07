import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { InternalError, NotFoundError } from "@/exceptions";
import { customerOrdersModel } from "./model";
import { CustomerOrderService } from "./service";

export const customerOrdersController = new Elysia({
  prefix: "/customerorders",
})
  .use(betterAuth)
  .use(customerOrdersModel)
  .guard({
    tags: ["Customer Orders"],
    isCustomer: true,
  })
  .get(
    "/",
    async ({ status, user, query }) => {
      try {
        const userId = user.id;
        const { data, totalData, totalPages } =
          await CustomerOrderService.getCustomerOrders(userId, query.page);

        return status(200, {
          status: 200,
          message: "Customer orders fetched successfully",
          messageKey: "order.retrieved",
          data,
          totalData,
          totalPages,
        });
      } catch (error) {
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
      }),
    }
  )
  .post(
    "/request-pickup",
    async ({ status, body, user }) => {
      try {
        const newOrderId = await CustomerOrderService.createPickupRequest(
          body,
          user
        );

        return status(201, {
          status: "success",
          message: "Pickup request submitted successfully",
          messageKey: "order.pickupRequested",
          data: { orderId: newOrderId },
        });
      } catch (error) {
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "requestPickupSchema",
      parse: "application/json",
    }
  )
  .post(
    "/request-delivery",
    async ({ status, body, user }) => {
      try {
        const userId = user.id;
        const newDeliveryId =
          await CustomerOrderService.createDeliveryRequest({
            userId,
            ...body,
          });

        return status(201, {
          status: "success",
          message: "Delivery request submitted successfully",
          messageKey: "order.deliveryRequested",
          data: { deliveryId: newDeliveryId },
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "order.notFound",
            messageParams: { id: body.orderId },
            data: null,
          });
        }
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "requestDeliverySchema",
    }
  )
  .guard({
    params: t.Object({
      id: t.String(),
    }),
  })
  .get("/:id/detail", async ({ status, params, user }) => {
    try {
      const data = await CustomerOrderService.getOrderDetail(
        params.id,
        user.id
      );
      return status(200, {
        status: 200,
        message: "Order detail fetched successfully",
        messageKey: "order.detail.retrieved",
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "order.notFound",
          messageParams: { id: params.id },
          data: null,
        });
      }
      throw error;
    }
  })
  .get("/:id/items", async ({ status, params, user }) => {
    try {
      const data = await CustomerOrderService.getOrderItems(
        params.id,
        user.id
      );
      return status(200, {
        status: 200,
        message: "Order items fetched successfully",
        messageKey: "order.items.retrieved",
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "order.notFound",
          messageParams: { id: params.id },
          data: null,
        });
      }
      throw error;
    }
  })
  .get("/:id/payment", async ({ status, params, user }) => {
    try {
      const data = await CustomerOrderService.getOrderPayment(
        params.id,
        user.id
      );
      return status(200, {
        status: 200,
        message: "Order payment fetched successfully",
        messageKey: "order.payment.retrieved",
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "order.payment.notFound",
          data: null,
        });
      }
      throw error;
    }
  })
  .post("/:id/payment", async ({ status, params, user }) => {
    try {
      const data = await CustomerOrderService.chargeQrisPayment(
        params.id,
        user.id
      );

      return status(200, {
        status: 201,
        message: "QRIS Payment Created",
        messageKey: "order.payment.created",
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "order.notFound",
          messageParams: { id: params.id },
          data: null,
        });
      }
      if (error instanceof InternalError) {
        return status(500, {
          status: "error",
          message: error.message,
          messageKey: "common.unexpectedError",
          data: null,
        });
      }
      throw error;
    }
  })
  .get("/:id/delivery", async ({ status, params, user }) => {
    try {
      const data = await CustomerOrderService.getOrderDelivery(
        params.id,
        user.id
      );
      return status(200, {
        status: 200,
        message: "Order delivery fetched successfully",
        messageKey: "order.delivery.retrieved",
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "order.notFound",
          messageParams: { id: params.id },
          data: null,
        });
      }
      if (error instanceof InternalError) {
        return status(500, {
          status: "error",
          message: error.message,
          messageKey: "common.unexpectedError",
          data: null,
        });
      }
      throw error;
    }
  })
  .patch("/:id", async ({ status, params, user }) => {
    try {
      const data = await CustomerOrderService.cancelOrder(
        params.id,
        user.id
      );

      return status(200, {
        status: 200,
        message: "Order cancelled successfully",
        messageKey: "order.cancelled",
        data,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "order.notFound",
          messageParams: { id: params.id },
          data: null,
        });
      }
      if (error instanceof InternalError) {
        return status(500, {
          status: "error",
          message: error.message,
          messageKey: "common.unexpectedError",
          data: null,
        });
      }
      throw error;
    }
  })
  .get(
    "/:id/payment_details",
    async ({ status, params, user }) => {
      try {
        const paymentDetails =
          await CustomerOrderService.getOrderPaymentDetails(
            params.id,
            user.id
          );

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
            message: error.message,
            messageKey: "order.payment.notFound",
            data: null,
          });
        }
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      isCustomer: true,
    }
  );
