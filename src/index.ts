import { mkdir } from "node:fs/promises";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { dts } from "elysia-remote-dts";
import { OpenAPI } from "./auth";
import { betterAuth } from "./auth-instance";
import { customError } from "./exceptions";
import { productsController } from "./modules/products";
import { fileUploadController } from "./modules/uploads";
import { defaultResponseModel } from "./responses";

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
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    staticPlugin({
      assets: "public",
    }),
  )
  .use(betterAuth)
  .use(defaultResponseModel)
  .use(customError)
  .use(productsController)
  .use(fileUploadController)
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
