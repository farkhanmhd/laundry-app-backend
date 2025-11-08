import { write } from "bun";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema/products";
import { stockAdjustments } from "@/db/schema/stock-adjustments";
import { InternalError, NotFoundError } from "@/exceptions";
import { redis } from "@/redis";
import type {
  AddProductBody,
  AdjustQuantitySchema,
  Product,
  UpdateProductBody,
  UpdateProductImage,
} from "./model";

const PRODUCTS_CACHE_KEY = "products:all";

export abstract class Products {
  static async getProducts() {
    const json = await redis.get("categories");

    if (json) {
      return JSON.parse(json) as Product[];
    }

    const rows: Product[] = await db
      .select()
      .from(products)
      .where(isNull(products.deletedAt))
      .orderBy(desc(products.createdAt));

    await redis.set(PRODUCTS_CACHE_KEY, JSON.stringify(rows), "EX", 3600);

    return rows;
  }

  static async addProduct(formData: AddProductBody) {
    const { name, image, price, currentQuantity, reorderPoint, description } =
      formData;
    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;
    await write(fullPath, image);
    const result = await db
      .insert(products)
      .values({
        name: name as string,
        description: description as string,
        image: imageUrl,
        price,
        currentQuantity,
        reorderPoint,
      })
      .returning(); // return all columns
    if (result.length === 0) {
      throw new InternalError();
    }
    const row = result[0]; // safe because result.length > 0
    await redis.del(PRODUCTS_CACHE_KEY);
    await redis.set(`products:${row?.id}`, JSON.stringify(row), "EX", 3600);
    return row;
  }

  static async getProductById(id: string) {
    const cacheKey = `products:${id}`;
    const json = await redis.get(cacheKey);
    if (json) {
      return JSON.parse(json) as Product;
    }
    const row = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);
    if (!row.length) {
      throw new NotFoundError("Product not found");
    }

    await redis.set(cacheKey, JSON.stringify(row[0]), "EX", 3600);
    return row[0] as Product;
  }

  static async updateProduct(id: string, data: UpdateProductBody) {
    const result = await db
      .update(products)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(PRODUCTS_CACHE_KEY);
    await redis.del(`products:${id}`);

    return result[0]?.id as string;
  }

  static async updateProductImage(id: string, data: UpdateProductImage) {
    const { image } = data;

    const fileName = `${Date.now()}-${image.name.split(" ").join("-")}`;
    const folderPath = "public/uploads";
    const fullPath = `${folderPath}/${fileName}`;
    const imageUrl = `${process.env.BETTER_AUTH_URL}/uploads/${fileName}`;

    await write(fullPath, image);

    const result = await db
      .update(products)
      .set({ image: imageUrl })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!result.length) {
      throw new InternalError();
    }

    await redis.del(PRODUCTS_CACHE_KEY);
    await redis.del(`products:${id}`);

    return result[0]?.id as string;
  }

  static async adjustQuantity(
    userId: string,
    productId: string,
    body: AdjustQuantitySchema
  ) {
    const stockAdjustmentId = await db.transaction(async (tx) => {
      const selectedProduct = (
        await tx
          .select({
            productId: products.id,
            previousQuantity: products.currentQuantity,
          })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1)
      )[0];

      if (!selectedProduct) {
        tx.rollback();
        throw new NotFoundError("Product Id not found");
      }

      const stockAdjustment = (
        await tx
          .insert(stockAdjustments)
          .values({
            ...selectedProduct,
            newQuantity: body.newQuantity,
            reason: body.reason,
            userId,
          })
          .returning({ id: stockAdjustments.id })
      )[0];

      if (!stockAdjustment?.id) {
        tx.rollback();
        throw new InternalError();
      }

      const updateProduct = (
        await tx
          .update(products)
          .set({ currentQuantity: body.newQuantity })
          .where(eq(products.id, productId))
          .returning({ id: products.id })
      )[0];

      if (!updateProduct?.id) {
        throw new InternalError();
      }

      return stockAdjustment.id;
    });

    await redis.del(PRODUCTS_CACHE_KEY);
    await redis.del(`products:${productId}`);

    return stockAdjustmentId;
  }

  static async deleteProduct(id: string) {
    const result = await db
      .update(products)
      .set({ deletedAt: sql`now()` })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!result.length) {
      throw new InternalError("Product id not valid");
    }

    await redis.del(PRODUCTS_CACHE_KEY);
    await redis.del(`products:${id}`);

    return result[0]?.id as string;
  }
}
