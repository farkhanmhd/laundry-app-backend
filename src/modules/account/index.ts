import Elysia from "elysia";
import { betterAuth } from "@/auth/auth-instance";
import {
  AuthorizationError,
  ConflictError,
  InternalError,
  NotFoundError,
} from "@/exceptions";
import { accountModel } from "./model";
import { AccountService } from "./service";

export const accountController = new Elysia({ prefix: "/account" })
  .use(betterAuth)
  .use(accountModel)
  .guard({
    auth: true,
    tags: ["Account"],
  })
  .get("/info", async ({ status, user }) => {
    try {
      const userData = await AccountService.getAccountInfo(user.id);
      return status(200, {
        status: "success",
        message: "Account info retrieved successfully",
        messageKey: "profile.retrieved",
        data: userData,
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
      throw error;
    }
  })
  .get("/", async ({ status, user }) => {
    try {
      const userData = await AccountService.getUserData(user.id);
      return status(200, {
        status: "success",
        message: "User role retrieved successfully",
        messageKey: "profile.retrieved",
        data: userData,
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
      throw error;
    }
  })
  .patch(
    "/info",
    async ({ status, user, body }) => {
      try {
        const updatedUserId = await AccountService.updateAccountInfo(
          user.id,
          user.role as string,
          body
        );
        return status(200, {
          status: "success",
          message: "Account info updated successfully",
          messageKey: "profile.updated",
          data: updatedUserId,
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          return status(409, {
            status: "error",
            message: error.message,
            messageKey: "validation.alreadyExists",
            messageParams: { username: body.username },
            data: null,
          });
        }
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "common.notFound",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "updateInfo",
    }
  )
  .patch(
    "/password",
    async ({ status, body, headers }) => {
      try {
        const updatedUserId = await AccountService.updatePassword(
          body,
          headers
        );
        return status(200, {
          status: "success",
          message: "Password updated successfully",
          messageKey: "password.updated",
          data: updatedUserId,
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
        throw error;
      }
    },
    {
      body: "updatePassword",
      auth: true,
    }
  )
  .post(
    "/phone",
    async ({ status, user, body }) => {
      try {
        await AccountService.updatePhoneNumber(user.id, body);
        return status(200, {
          status: "success",
          message: "Phone number updated",
          messageKey: "profile.phone.updated",
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
            messageKey: "profile.phoneTaken",
            messageParams: { phone: body.phoneNumber },
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "updatePhoneNumber",
    }
  )
  .post(
    "/address",
    async ({ status, user, body }) => {
      try {
        const newAddress = await AccountService.addAddress(user.id, body);
        return status(201, {
          status: "success",
          message: "Address added successfully",
          messageKey: "address.added",
          data: newAddress,
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          return status(409, {
            status: "error",
            message: error.message,
            messageKey: "address.limitReached",
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
    {
      body: "addAddress",
    }
  )
  .get("/addresses", async ({ status, user }) => {
    try {
      const userAddresses = await AccountService.getUserAddresses(user.id);
      return status(200, {
        status: "success",
        message: "Addresses retrieved successfully",
        messageKey: "address.retrieved",
        data: userAddresses,
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
  })
  .delete("/address/:id", async ({ status, user, params }) => {
    try {
      const deletedAddress = await AccountService.deleteAddress(
        user.id,
        params.id
      );
      return status(200, {
        status: "success",
        message: "Address deleted successfully",
        messageKey: "address.deleted",
        data: deletedAddress,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return status(404, {
          status: "error",
          message: error.message,
          messageKey: "address.notFound",
          messageParams: { id: params.id },
          data: null,
        });
      }
      if (error instanceof AuthorizationError) {
        return status(403, {
          status: "error",
          message: error.message,
          messageKey: "common.forbidden",
          data: null,
        });
      }
      throw error;
    }
  })
  .patch(
    "/address/:id",
    async ({ status, user, params, body }) => {
      try {
        const updatedAddress = await AccountService.updateAddress(
          user.id,
          params.id,
          body
        );
        return status(200, {
          status: "success",
          message: "Address updated successfully",
          messageKey: "address.updated",
          data: updatedAddress,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return status(404, {
            status: "error",
            message: error.message,
            messageKey: "address.notFound",
            messageParams: { id: params.id },
            data: null,
          });
        }
        if (error instanceof AuthorizationError) {
          return status(403, {
            status: "error",
            message: error.message,
            messageKey: "common.forbidden",
            data: null,
          });
        }
        throw error;
      }
    },
    {
      body: "updateAddress",
    }
  );
