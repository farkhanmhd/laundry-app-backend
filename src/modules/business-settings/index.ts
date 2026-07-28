import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { NotFoundError } from "@/exceptions";
import { businessSettingsModel } from "./model";
import { BusinessSettingsService } from "./service";

export const businessSettingsController = new Elysia({
  prefix: "/business-settings",
})
  .use(betterAuth)
  .use(businessSettingsModel)
  .guard({
    detail: {
      tags: ["Business Settings"],
    },
  })
  .get(
    "/",
    async ({ status }) => {
      try {
        const result = await BusinessSettingsService.get();
        return status(200, {
          status: "success",
          message: "Business settings retrieved",
          messageKey: "businessSettings.retrieved",
          data: result,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "businessSettings.notFound",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      auth: true,
    }
  )
  .put(
    "/",
    async ({ status, body }) => {
      const result = await BusinessSettingsService.upsert(body);
      return status(200, {
        status: "success",
        message: "Business settings updated",
        messageKey: "businessSettings.updated",
        data: result,
      });
    },
    {
      body: "createBusinessSettingsSchema",
      isSuperAdmin: true,
    }
  )
  .patch(
    "/",
    async ({ status, body }) => {
      const result = await BusinessSettingsService.upsert(body);
      return status(200, {
        status: "success",
        message: "Business settings updated",
        messageKey: "businessSettings.updated",
        data: result,
      });
    },
    {
      body: "updateBusinessSettingsSchema",
      isSuperAdmin: true,
    }
  );
