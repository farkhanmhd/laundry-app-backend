import { Elysia } from "elysia";
import { betterAuth } from "@/auth-instance";
import { Staffs } from "./service";

export const staffsController = new Elysia({ prefix: "/staffs" })
  .use(betterAuth)
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
