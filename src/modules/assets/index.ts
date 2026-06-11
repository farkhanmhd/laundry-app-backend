import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { NotFoundError } from "@/exceptions";
import { searchQueryModel } from "@/search-query";
import { assetsModel } from "./model";
import { AssetService } from "./service";

export const assetsController = new Elysia({ prefix: "/assets" })
  .use(betterAuth)
  .use(searchQueryModel)
  .use(assetsModel)
  .guard({
    detail: {
      tags: ["Assets"],
    },
  })
  .get(
    "/",
    async ({ status, query }) => {
      const result = await AssetService.getAssets(query);
      return status(200, {
        status: "success",
        message: "Assets retrieved",
        messageKey: "asset.retrieved",
        data: result,
      });
    },
    {
      query: "searchQuery",
      auth: true,
    }
  )
  .post(
    "/",
    async ({ status, body }) => {
      const asset = await AssetService.createAsset(body);
      return status(201, {
        status: "success",
        message: "Asset created",
        messageKey: "asset.created",
        data: asset,
      });
    },
    {
      body: "createAssetSchema",
      isSuperAdmin: true,
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await AssetService.updateAsset(id, body);
        return status(200, {
          status: "success",
          message: "Asset updated",
          messageKey: "asset.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "asset.notFound",
            messageParams: { id },
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "updateAssetSchema",
      isSuperAdmin: true,
    }
  )
  .delete(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        await AssetService.deleteAsset(id);
        return status(200, {
          status: "success",
          message: "Asset deleted",
          messageKey: "asset.deleted",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "asset.notFound",
            messageParams: { id },
            data: null,
          });
        }
        throw error;
      }
    },
    {
      isSuperAdmin: true,
    }
  );
