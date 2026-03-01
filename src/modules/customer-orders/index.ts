import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { CustomerOrderService } from "./service";

export const customerOrdersController = new Elysia({
  prefix: "/customerorders",
})
  .use(betterAuth)
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
  });
