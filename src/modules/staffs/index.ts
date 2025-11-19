import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { Staffs } from "./service";

export const staffsController = new Elysia({ prefix: "/staffs" })
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Staff"],
    },
  })
  .get(
    "/",
    async ({ status }) => {
      const result = await Staffs.getStaffs();

      return status(200, {
        status: "success",
        message: "Services Retrieved",
        data: result,
      });
    },
    {
      isSuperAdmin: true,
    }
  );
