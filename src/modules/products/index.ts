import { Elysia } from "elysia";
import { betterAuth } from "@/auth-instance";
import { type GetProducts, productsModel } from "./model";
import { Products } from "./service";

export const productsController = new Elysia({ prefix: "/products" })
  .use(productsModel)
  .use(betterAuth)
  .get(
    "/",
    async ({ status }) => {
      const result = await Products.getProducts();

      return status(200, {
        status: "success",
        message: "Products Retrieved",
        data: result,
      } as GetProducts);
    },
    {
      response: "getProducts",
      auth: true,
    },
  )
  .put(
    "/",
    async ({ body, status }) => {
      const newProductId = await Products.addProduct(body);

      return status(201, {
        status: "success",
        message: "New Product Created",
        data: {
          id: newProductId,
        },
      });
    },
    {
      body: "addProduct",
      response: {
        201: "addProductResponse",
      },
      isAdmin: true,
    },
  );
