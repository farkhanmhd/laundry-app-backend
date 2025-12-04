import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { Pos } from "./service";

export const posController = new Elysia({ prefix: "/pos" })
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Pos"],
    },
  })
  .get("/", async ({ status }) => {
    const result = await Pos.getPosItems();

    return status(200, {
      status: "success",
      message: "Pos Items Retrieved",
      data: result,
    });
  });
