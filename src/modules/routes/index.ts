import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { AuthorizationError } from "@/exceptions";
import { searchQueryModel } from "@/search-query";
import { RoutesService } from "./service";

export const routesController = new Elysia({ prefix: "/routes" })
  .use(betterAuth)
  .use(searchQueryModel)
  .guard({
    tags: ["Routes"],
    auth: true,
  })
  .get(
    "/",
    async ({ status, user, query }) => {
      const role = user.role ?? "user";
      if (role !== "superadmin" && role !== "driver") {
        throw new AuthorizationError();
      }

      const data = await RoutesService.getRoutes(role, user.id, query);

      return status(200, {
        status: "success",
        message: "Routes retrieved successfully",
        data,
      });
    },
    {
      query: "searchQuery",
    }
  )
  .get("/:id", async ({ params, status, user }) => {
    const role = user.role ?? "user";
    if (role !== "superadmin" && role !== "driver") {
      throw new AuthorizationError();
    }

    await RoutesService.verifyRouteAccess(user.id, role);

    const data = await RoutesService.getRouteById(params.id);

    return status(200, {
      status: "success",
      message: "Route retrieved successfully",
      data,
    });
  })
  .patch("/:id", async ({ params, status, user }) => {
    const role = user.role ?? "user";
    if (role !== "superadmin" && role !== "driver") {
      throw new AuthorizationError();
    }

    await RoutesService.finishRoute(params.id);

    return status(200, {
      status: "success",
      message: "Route completed successfully",
    });
  });
