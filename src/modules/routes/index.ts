import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { RoutesService } from "./service";

export const routesController = new Elysia({ prefix: "/routes" })
  .use(betterAuth)
  .guard({
    tags: ["Routes"],
    isAdmin: true,
  })
  .get("/:id", async ({ params, status }) => {
    const data = await RoutesService.getRouteById(params.id);

    return status(200, {
      status: "success",
      message: "Route retrieved successfully",
      data,
    });
  })
  .patch("/:id", async ({ params, status }) => {
    await RoutesService.finishRoute(params.id);

    return status(200, {
      status: "success",
      message: "Route completed successfully",
    });
  });
