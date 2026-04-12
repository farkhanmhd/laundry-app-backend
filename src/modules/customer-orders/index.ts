import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
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
      const userId = user.id;
      const { data, totalData, totalPages } =
        await CustomerOrderService.getCustomerOrders(userId, query.page);

      return status(200, {
        status: 200,
        message: "Customer orders fetched successfully",
        data,
        totalData,
        totalPages,
      });
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
      const newOrderId = await CustomerOrderService.createPickupRequest(
        body,
        user
      );

      return status(201, {
        status: "success",
        message: "Pickup request submitted successfully",
        data: { orderId: newOrderId },
      });
    },
    {
      body: "requestPickupSchema",
      parse: "application/json",
    }
  )
  .post(
    "/request-delivery",
    async ({ status, body, user }) => {
      const userId = user.id;
      const newDeliveryId = await CustomerOrderService.createDeliveryRequest({
        userId,
        ...body,
      });

      return status(201, {
        status: "success",
        message: "Delivery request submitted successfully",
        data: { deliveryId: newDeliveryId },
      });
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
    const data = await CustomerOrderService.getOrderDetail(params.id, user.id);
    return status(200, {
      status: 200,
      message: "Order detail fetched successfully",
      data,
    });
  })
  .get("/:id/items", async ({ status, params, user }) => {
    const data = await CustomerOrderService.getOrderItems(params.id, user.id);
    return status(200, {
      status: 200,
      message: "Order items fetched successfully",
      data,
    });
  })
  .get("/:id/payment", async ({ status, params, user }) => {
    const data = await CustomerOrderService.getOrderPayment(params.id, user.id);
    return status(200, {
      status: 200,
      message: "Order payment fetched successfully",
      data,
    });
  })
  .post("/:id/payment", async ({ status, params, user }) => {
    const data = await CustomerOrderService.chargeQrisPayment(
      params.id,
      user.id
    );

    return status(200, {
      status: 201,
      message: "QRIS Payment Created",
      data,
    });
  })
  .get("/:id/delivery", async ({ status, params, user }) => {
    const data = await CustomerOrderService.getOrderDelivery(
      params.id,
      user.id
    );
    return status(200, {
      status: 200,
      message: "Order delivery fetched successfully",
      data,
    });
  })
  .get(
    "/:id/payment_details",
    async ({ status, params, user }) => {
      const paymentDetails = await CustomerOrderService.getOrderPaymentDetails(
        params.id,
        user.id
      );

      return status(200, {
        status: "success",
        message: "Order Payment Details Retrieved",
        data: paymentDetails,
      });
    },
    {
      isCustomer: true,
    }
  );
