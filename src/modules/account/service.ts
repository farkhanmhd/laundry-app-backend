import { count, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth/auth";
import { db } from "@/db";
import { addresses } from "@/db/schema/addresses";
import { user } from "@/db/schema/auth";
import { members } from "@/db/schema/members";
import { InternalError, NotFoundError } from "@/exceptions";
import type {
  AddAddressSchema,
  UpdateAccountInfoSchema,
  UpdatePasswordSchema,
  UpdatePhoneNumberSchema,
} from "./model";

export abstract class AccountService {
  static async updatePhoneNumber(
    userId: string,
    data: UpdatePhoneNumberSchema
  ) {
    await db.transaction(async (tx) => {
      const [currentUser] = await tx
        .select({ phoneNumber: user.phoneNumber })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!currentUser) {
        throw new NotFoundError("User not found");
      }

      if (currentUser.phoneNumber) {
        throw new InternalError("User already has a phone number");
      }

      const [userPhone] = await tx
        .select({ phoneNumber: user.phoneNumber })
        .from(user)
        .where(eq(user.phoneNumber, `+62${data.phoneNumber}`))
        .limit(1);

      if (userPhone?.phoneNumber === `+62${data.phoneNumber}`) {
        throw new InternalError("Phone number is already used");
      }

      await tx
        .update(user)
        .set({ phoneNumber: `+62${data.phoneNumber}` })
        .where(eq(user.id, userId));

      await tx
        .update(members)
        .set({ phone: `+62${data.phoneNumber}` })
        .where(eq(members.userId, userId));
    });
  }

  static async getAccountInfo(userId: string) {
    const [userData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phoneNumber,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      throw new Error("User not found");
    }

    return userData;
  }

  static async getUserData(userId: string) {
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      throw new Error("User not found");
    }

    return userData;
  }

  static async updateAccountInfo(
    userId: string,
    role: string,
    data: UpdateAccountInfoSchema
  ) {
    const isMember = role === "user";

    const updatedUserId = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(user)
        .set(data)
        .where(eq(user.id, userId))
        .returning({ id: user.id });

      if (!result) {
        throw new Error("User not found");
      }

      if (isMember) {
        const [memberResult] = await tx
          .update(members)
          .set({ name: data.name, phone: data.phone })
          .where(eq(members.userId, userId))
          .returning({ id: members.id });

        if (!memberResult) {
          throw new Error("Member not found");
        }
      }

      return result.id;
    });

    return updatedUserId;
  }

  static async updatePassword(
    body: UpdatePasswordSchema,
    headers: Record<string, string | undefined>
  ) {
    const { currentPassword, newPassword } = body;
    const data = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers,
    });

    if (!data.user) {
      throw new Error("User not found");
    }

    return data;
  }

  static async addAddress(userId: string, data: AddAddressSchema) {
    const [addressCount] = await db
      .select({ count: count() })
      .from(addresses)
      .where(eq(addresses.userId, userId));

    if (addressCount && addressCount.count >= 3) {
      throw new Error("Maximum of 3 addresses allowed per user");
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId,
        label: data.label,
        address: data.street,
        latitude: data.lat.toString(),
        longitude: data.lng.toString(),
        notes: data.note ?? null,
      })
      .returning({ id: addresses.id });

    if (!newAddress) {
      throw new Error("Failed to create address");
    }

    return newAddress;
  }

  static async getUserAddresses(userId: string) {
    const userAddresses = await db
      .select({
        id: addresses.id,
        label: addresses.label,
        street: addresses.address,
        lat: sql<number>`cast(${addresses.latitude} as float)`,
        lng: sql<number>`cast(${addresses.longitude} as float)`,
        note: addresses.notes,
      })
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.createdAt));

    return userAddresses;
  }

  static async deleteAddress(userId: string, addressId: string) {
    const [existingAddress] = await db
      .select({ id: addresses.id, userId: addresses.userId })
      .from(addresses)
      .where(eq(addresses.id, addressId))
      .limit(1);

    if (!existingAddress) {
      throw new Error("Address not found");
    }

    if (existingAddress.userId !== userId) {
      throw new Error("Unauthorized to delete this address");
    }

    const [deletedAddress] = await db
      .delete(addresses)
      .where(eq(addresses.id, addressId))
      .returning({ id: addresses.id });

    return deletedAddress;
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<AddAddressSchema>
  ) {
    const updatedAddress = await db.transaction(async (tx) => {
      const [existingAddress] = await tx
        .select({ id: addresses.id, userId: addresses.userId })
        .from(addresses)
        .where(eq(addresses.id, addressId))
        .limit(1);

      if (!existingAddress) {
        throw new Error("Address not found");
      }

      if (existingAddress.userId !== userId) {
        throw new Error("Unauthorized to update this address");
      }

      const updateData: Record<string, unknown> = {};
      if (data.label !== undefined) {
        updateData.label = data.label;
      }
      if (data.street !== undefined) {
        updateData.address = data.street;
      }
      if (data.lat !== undefined) {
        updateData.latitude = data.lat.toString();
      }
      if (data.lng !== undefined) {
        updateData.longitude = data.lng.toString();
      }
      if (data.note !== undefined) {
        updateData.notes = data.note ?? null;
      }

      const [updated] = await tx
        .update(addresses)
        .set(updateData)
        .where(eq(addresses.id, addressId))
        .returning({
          id: addresses.id,
          label: addresses.label,
          street: addresses.address,
          lat: sql<number>`cast(${addresses.latitude} as float)`,
          lng: sql<number>`cast(${addresses.longitude} as float)`,
          note: addresses.notes,
        });

      return updated;
    });

    return updatedAddress;
  }
}
