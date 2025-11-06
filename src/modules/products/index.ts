import { Elysia } from "elysia";
import { betterAuth } from "@/auth-instance";
import { productsModel } from "./model";
import { Products } from "./service";

export const productsController = new Elysia({ prefix: "/products" })
  .use(productsModel)
  .use(betterAuth)
  .guard({
    detail: {
      tags: ["Product"],
    },
  })
  .get(
    "/",
    async ({ status }) => {
      try {
        const result = await Products.getProducts();
        return status(200, {
          status: "success",
          message: "Products Retrieved",
          data: result,
        });
      } catch {
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    {
      auth: true,
    }
  )
  .get(
    "/:id",
    async ({ params, status }) => {
      try {
        const product = await Products.getProductById(params.id as string);
        return status(200, {
          status: "success",
          message: "Product Retrieved",
          data: product,
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "NotFoundError"
        ) {
          return status(404, {
            status: "error",
            message: "Product not found",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    { auth: true }
  )
  .guard({
    isSuperAdmin: true,
  })
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const product = await Products.addProduct(body);
        return status(201, {
          status: "success",
          message: "New Product Created",
          data: product,
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "InternalError"
        ) {
          return status(400, {
            status: "error",
            message: "Failed to create product",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    {
      parse: "multipart/form-data",
      body: "addProduct",
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await Products.updateProduct(id, body);
        return status(200, {
          status: "success",
          message: "Product Updated",
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "NotFoundError"
        ) {
          return status(404, {
            status: "error",
            message: "Product not found",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    {
      body: "updateProduct",
      parse: "application/json",
    }
  )
  .patch(
    "/:id/image",
    async ({ params: { id }, body, status }) => {
      try {
        await Products.updateProductImage(id as string, body);
        return status(200, {
          status: "success",
          message: "Product updated",
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "NotFoundError"
        ) {
          return status(404, {
            status: "error",
            message: "Product not found",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    {
      body: "updateProductImage",
    }
  )
  .patch(
    "/:id/stock",
    async ({ params: { id }, status, body, user }) => {
      try {
        await Products.adjustQuantity(user.id, id as string, body);
        return status(200, {
          status: "success",
          message: "Quantity Updated",
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "NotFoundError"
        ) {
          return status(404, {
            status: "error",
            message: "Product not found",
          });
        }
        return status(500, {
          status: "error",
          message: "Internal server error",
        });
      }
    },
    {
      parse: "application/json",
      body: "adjustQuantity",
    }
  )
  .delete("/:id", async ({ params: { id }, status }) => {
    try {
      await Products.deleteProduct(id as string);
      return status(200, {
        status: "success",
        message: "Product deleted",
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "NotFoundError"
      ) {
        return status(404, {
          status: "error",
          message: "Product not found",
        });
      }
      return status(500, {
        status: "error",
        message: "Internal server error",
      });
    }
  });
