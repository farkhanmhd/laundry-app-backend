import { Elysia } from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import { ConflictError, InternalError, NotFoundError } from "@/exceptions";
import { weightRangesModel } from "./model";
import { WeightRangeService } from "./service";

export const weightRangesController = new Elysia({ prefix: "/weight-ranges" })
  .use(weightRangesModel)
  .use(betterAuth)
  .guard({
    detail: { tags: ["Weight Ranges"] },
  })
  .get(
    "/",
    async ({ status }) => {
      try {
        const data = await WeightRangeService.getAll();
        return status(200, {
          status: "success",
          message: "Weight ranges retrieved",
          messageKey: "weightRange.retrieved",
          data,
        });
      } catch (error) {
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    { auth: true }
  )
  .guard({ isSuperAdmin: true })
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const id = await WeightRangeService.create(body);
        return status(201, {
          status: "success",
          message: "Weight range created",
          messageKey: "weightRange.created",
          data: { id },
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          return status(409, {
            status: "error",
            message: error.message,
            messageKey: "validation.alreadyExists",
            data: null,
          });
        }
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    { body: "createWeightRangeSchema" }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, status }) => {
      try {
        await WeightRangeService.update(Number(id), body);
        return status(200, {
          status: "success",
          message: "Weight range updated",
          messageKey: "weightRange.updated",
          data: null,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "common.notFound",
            data: null,
          });
        }
        if (error instanceof ConflictError) {
          return status(409, {
            status: "error",
            message: error.message,
            messageKey: "validation.alreadyExists",
            data: null,
          });
        }
        if (error instanceof InternalError) {
          return status(500, {
            status: "error",
            message: error.message,
            messageKey: "common.unexpectedError",
            data: null,
          });
        }
        throw error;
      }
    },
    { body: "updateWeightRangeSchema" }
  );
