import { mkdir } from "node:fs/promises";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { dts } from "elysia-remote-dts";
import { OpenAPI } from "./auth/auth";
import { betterAuth } from "./auth/auth-instance";
import { exceptionHandler } from "./exceptions";
import { bundlingsController } from "./modules/bundlings";
import { inventoriesController } from "./modules/inventories";
import { membersController } from "./modules/members";
import { ordersController } from "./modules/orders";
import { posController } from "./modules/pos";
import { salesController } from "./modules/sales";
import { servicesController } from "./modules/services";
import { staffsController } from "./modules/staffs";
import { fileUploadController } from "./modules/uploads";
import { usersController } from "./modules/users";
import { vouchersController } from "./modules/vouchers";
import { responseHandler } from "./responses";

const port = Number(process.env.APP_PORT as string);

const uploadDir = "public/uploads";
await mkdir(uploadDir, { recursive: true });

const app = new Elysia()
  .use(
    dts("./src/server.ts", {
      dtsPath: "/types.d.ts",
    })
  )
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
        tags: [
          { name: "Inventory", description: "Inventory API endpoints" },
          { name: "Member", description: "Member API endpoints" },
          { name: "Service", description: "Service API endpoints" },
          { name: "Voucher", description: "Voucher API endpoints" },
          { name: "Bundlings", description: "Bundlings API endpoints" },
          { name: "Staff", description: "Staff API endpoints" },
          { name: "Pos", description: "Point of Sales API endpoints" },
          { name: "Orders", description: "Orders API endpoints" },
          { name: "Uploads", description: "Uploads API endpoints" },
        ],
      },
    })
  )
  .use(
    cors({
      origin: [process.env.FRONTEND_URL as string],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(betterAuth)
  .use(responseHandler)
  .use(exceptionHandler)
  .use(inventoriesController)
  .use(membersController)
  .use(servicesController)
  .use(vouchersController)
  .use(bundlingsController)
  .use(staffsController)
  .use(posController)
  .use(ordersController)
  .use(salesController)
  .use(usersController)
  .use(
    staticPlugin({
      assets: "public",
    })
  )
  .use(fileUploadController)
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
