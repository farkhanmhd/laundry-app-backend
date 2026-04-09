import { Elysia, t } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { customerDeliveriesModel } from "./model";
import { CustomerDeliveriesService } from "./service";

export const customerDeliveriesController = new Elysia({
  prefix: "/customer-deliveries",
})
  .use(betterAuth)
  .use(customerDeliveriesModel)
  .guard({
    tags: ["Customer Deliveries"],
    isCustomer: true,
  })
  .get(
    "/",
    async ({ status, user, query }) => {
      const { data, totalData, totalPages } =
        await CustomerDeliveriesService.getDeliveries(user.id, query.page);

      return status(200, {
        status: "success",
        message: "Deliveries retrieved successfully",
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
  .get(
    "/:id",
    async ({ status, user, params }) => {
      const data = await CustomerDeliveriesService.getDeliveryById(
        user.id,
        params.id
      );
      return status(200, {
        status: "success",
        message: "Delivery retrieved successfully",
        data,
      });
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
