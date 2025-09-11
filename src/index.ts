import { mkdir } from "node:fs/promises";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { dts } from "elysia-remote-dts";
import { OpenAPI } from "./auth";
import { betterAuth } from "./auth-instance";
import { exceptionHandler } from "./exceptions";
import { chatController } from "./modules/chat";
import { productsController } from "./modules/products";
import { fileUploadController } from "./modules/uploads";
import { responseHandler } from "./responses";

const port = Number(process.env.APP_PORT as string);

const uploadDir = "public/uploads";
await mkdir(uploadDir, { recursive: true });

const app = new Elysia()
  .use(
    dts("./src/index.ts", {
      dtsPath: "/types.d.ts",
    }),
  )
  .use(
    swagger({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(
    cors({
      origin: [process.env.FRONTEND_URL as string],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(betterAuth)
  .use(responseHandler)
  .use(exceptionHandler)
  .use(chatController)
  .use(productsController)
  .use(fileUploadController)
  .use(
    staticPlugin({
      assets: "public",
    }),
  )
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
