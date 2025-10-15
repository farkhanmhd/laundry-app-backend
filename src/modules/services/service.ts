import { desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { type ServiceInsert, services } from "@/db/schema/services";
import { InternalError } from "@/exceptions";
import type {
  AddServiceBody,
  UpdateServiceBody,
  UpdateServiceImage,
} from "./model";

export abstract class Services {
  static async getServices() {
    const rows = await db
      .select()
      .from(services)
      .where(isNull(services.deletedAt))
      .orderBy(desc(services.createdAt));

    return rows;
  }

  static async addService(formData: AddServiceBody) {
    const { name, image, price } = formData;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await Bun.write(fullPath, image);

    const result = await db
      .insert(services)
      .values({
        name: name as string,
        image: imageUrl,
        price,
      })
      .returning({ id: services.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }

  static async updateService(id: string, data: UpdateServiceBody) {
    const { name, price } = data;

    const insertData: ServiceInsert = {
      name,
      price,
    };

    const result = await db
      .update(services)
      .set({ ...insertData, updatedAt: sql`now()` })
      .where(eq(services.id, id))
      .returning({ id: services.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }

  static async updateServiceImage(id: string, data: UpdateServiceImage) {
    const { image } = data;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await Bun.write(fullPath, image);

    const result = await db
      .update(services)
      .set({ image: imageUrl })
      .where(eq(services.id, id))
      .returning({ id: services.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }

  static async deleteService(id: string) {
    const result = await db
      .update(services)
      .set({ deletedAt: sql`now()` })
      .where(eq(services.id, id))
      .returning({ id: services.id, image: services.image });

    if (!result.length) {
      throw new InternalError("Service id not valid");
    }

    return result[0]?.id as string;
  }
}
