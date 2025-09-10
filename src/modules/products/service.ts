import { eq } from "drizzle-orm";
import { db } from "@/db";
import { type ProductInsert, products } from "@/db/schema/products";
import { stockAdjustments } from "@/db/schema/stock-adjustments";
import { InternalError, NotFoundError } from "@/exceptions";
import type { AddProductBody, AdjustQuantitySchema, UpdateProductBody, UpdateProductImage } from "./model";

export abstract class Products {
  static async getProducts() {
    const rows = await db.select().from(products);

    return rows;
  }

  static async addProduct(formData: AddProductBody) {
    const { name, image, price, currentQuantity, reorderPoint } = formData;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    // regular way
    await Bun.write(fullPath, image);

    // stream

    // const writer = Bun.file(fullPath).writer();

    // for await (const chunk of image.stream()) {
    //   writer.write(chunk);
    // }

    // await writer.end();

    const result = await db
      .insert(products)
      .values({
        name: name as string,
        image: imageUrl,
        price,
        currentQuantity,
        reorderPoint,
      })
      .returning({ id: products.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }

  static async updateProduct(id: string, data: UpdateProductBody) {
    const { name, price, reorderPoint } = data;

    const insertData: ProductInsert = {
      name,
      price,
      reorderPoint,
    };

    const result = await db.update(products).set(insertData).where(eq(products.id, id)).returning({ id: products.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }

  static async updateProductImage(id: string, data: UpdateProductImage) {
    const { image } = data;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await Bun.write(fullPath, image);

    const result = await db.update(products).set({ image: imageUrl }).where(eq(products.id, id)).returning({ id: products.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }

  static async adjustQuantity(userId: string, productId: string, body: AdjustQuantitySchema) {
    const stockAdjustmentId = await db.transaction(async (tx) => {
      const selectedProduct = (await tx.select({ productId: products.id, previousQuantity: products.currentQuantity }).from(products).where(eq(products.id, productId)).limit(1))[0];

      if (!selectedProduct) {
        tx.rollback();
        throw new NotFoundError("Product Id not found");
      }

      const stockAdjustment = (
        await tx
          .insert(stockAdjustments)
          .values({ ...selectedProduct, newQuantity: body.newQuantity, reason: body.reason, userId })
          .returning({ id: stockAdjustments.id })
      )[0];

      if (!stockAdjustment?.id) {
        tx.rollback();
        throw new InternalError();
      }

      const updateProduct = (await tx.update(products).set({ currentQuantity: body.newQuantity }).where(eq(products.id, productId)).returning({ id: products.id }))[0];

      if (!updateProduct?.id) {
        throw new InternalError();
      }

      return stockAdjustment.id;
    });

    return stockAdjustmentId;
  }

  static async deleteProduct(id: string) {
    const result = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });

    if (!result.length) {
      throw new InternalError("Product id not valid");
    }

    return result[0]?.id as string;
  }
}
