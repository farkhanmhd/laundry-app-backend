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
  .post(
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
      parse: "multipart/form-data",
      body: "addProduct",
      response: {
        201: "addProductResponse",
      },
      isAdmin: true,
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      await Products.updateProduct(id, body);

      return status(200, {
        status: "success",
        message: "Product updated",
      });
    },
    {
      parse: "application/json",
      body: "updateProduct",
      isAdmin: true,
    },
  )
  .patch(
    "/:id/image",
    async ({ params: { id }, body, status }) => {
      await Products.updateProductImage(id, body);

      return status(200, {
        status: "success",
        message: "Product updated",
      });
    },
    {
      isAdmin: true,
      body: "updateProductImage",
    },
  )
  .patch(
    "/:id/stock",
    async ({ params: { id }, status, body, user }) => {
      await Products.adjustQuantity(user.id, id, body);

      return status(200, {
        status: "success",
        message: "Quantity Updated",
      });
    },
    {
      parse: "application/json",
      isAdmin: true,
      body: "adjustQuantity",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, status }) => {
      await Products.deleteProduct(id);

      return status(200, {
        status: "success",
        message: "Product deleted",
      });
    },
    {
      isAdmin: true,
    },
  );
