import { mkdir } from "node:fs/promises";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { dts } from "elysia-remote-dts";
import { OpenAPI } from "./auth/auth";
import { betterAuth } from "./auth/auth-instance";
import { exceptionHandler } from "./exceptions";
import { accountController } from "./modules/account";
import { bundlingsController } from "./modules/bundlings";
import { customerDashboardController } from "./modules/customer-dashboard";
import { customerDeliveriesController } from "./modules/customer-deliveries";
import { customerOrdersController } from "./modules/customer-orders";
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
      enabled: process.env.NODE_ENV !== "production",
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
          {
            name: "Customer Dashboard",
            description: "Customer Dashboard API endpoints",
          },
        ],
      },
    })
  )
  .use(
    cors({
      origin: [
        process.env.FRONTEND_URL as string,
        process.env.MIDTRANS_URL as string,
      ],
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
  .use(customerOrdersController)
  .use(accountController)
  .use(customerDashboardController)
  .use(customerDeliveriesController)
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
