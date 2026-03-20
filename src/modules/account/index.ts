import Elysia from "elysia";
import { betterAuth } from "@/auth/auth-instance";
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
    const userData = await AccountService.getAccountInfo(user.id);
    return status(200, {
      status: "success",
      message: "Account info retrieved successfully",
      data: userData,
    });
  })
  .patch(
    "/info",
    async ({ status, user, body }) => {
      const updatedUserId = await AccountService.updateAccountInfo(
        user.id,
        user.role as string,
        body
      );
      return status(200, {
        status: "success",
        message: "Account info updated successfully",
        data: updatedUserId,
      });
    },
    {
      body: "updateInfo",
    }
  )
  .patch(
    "/password",
    async ({ status, body, headers }) => {
      const updatedUserId = await AccountService.updatePassword(body, headers);
      return status(200, {
        status: "success",
        message: "Password updated successfully",
        data: updatedUserId,
      });
    },
    {
      body: "updatePassword",
      auth: true,
    }
  )
  .post(
    "/address",
    async ({ status, user, body }) => {
      const newAddress = await AccountService.addAddress(user.id, body);
      return status(201, {
        status: "success",
        message: "Address added successfully",
        data: newAddress,
      });
    },
    {
      body: "addAddress",
    }
  )
  .get("/addresses", async ({ status, user }) => {
    const userAddresses = await AccountService.getUserAddresses(user.id);
    return status(200, {
      status: "success",
      message: "Addresses retrieved successfully",
      data: userAddresses,
    });
  })
  .delete("/address/:id", async ({ status, user, params }) => {
    const deletedAddress = await AccountService.deleteAddress(
      user.id,
      params.id
    );
    return status(200, {
      status: "success",
      message: "Address deleted successfully",
      data: deletedAddress,
    });
  })
  .patch(
    "/address/:id",
    async ({ status, user, params, body }) => {
      const updatedAddress = await AccountService.updateAddress(
        user.id,
        params.id,
        body
      );
      return status(200, {
        status: "success",
        message: "Address updated successfully",
        data: updatedAddress,
      });
    },
    {
      body: "updateAddress",
    }
  );
