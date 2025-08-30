import { db } from "@/db";
import { products } from "@/db/schema/products";
import { InternalError } from "@/exceptions";
import type { AddProductBody } from "./model";

export abstract class Products {
  static async getProducts() {
    const rows = await db.select().from(products);

    return rows;
  }

  static async addProduct(body: AddProductBody) {
    const { name, image, price, currentQuantity } = body;
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
        name,
        image: imageUrl,
        price,
        currentQuantity,
      })
      .returning({ id: products.id });

    if (!result.length) {
      throw new InternalError();
    }

    return result[0]?.id as string;
  }
}
