import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { searchQueryModel } from "@/search-query";
import { driversModel } from "./model";
import { DriverService } from "./service";

export const driversController = new Elysia({ prefix: "/drivers" })
  .use(betterAuth)
  .use(searchQueryModel)
  .use(driversModel)
  .guard({
    detail: {
      tags: ["Drivers"],
    },
  })
  .get(
    "/",
    async ({ status, query }) => {
      const result = await DriverService.getDrivers(query);
      return status(200, {
        status: "success",
        message: "Drivers retrieved",
        messageKey: "driver.retrieved",
        data: result,
      });
    },
    {
      query: "searchQuery",
      auth: true,
    }
  );
