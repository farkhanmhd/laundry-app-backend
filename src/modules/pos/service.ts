import { sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bundlings as bundlingsTable } from "@/db/schema/bundlings";
import { inventories as inventoriesTable } from "@/db/schema/inventories";
import { services as servicesTable } from "@/db/schema/services";
import { redis } from "@/redis";
import type { PosItem } from "./model";

const POS_CACHE_KEY = "pos:all";

export abstract class Pos {
  static async getPosItems() {
    const json = await redis.get(POS_CACHE_KEY);

    if (json) {
      return JSON.parse(json) as PosItem[];
    }

    const inventories = db
      .select({
        id: inventoriesTable.id,
        name: inventoriesTable.name,
        description: inventoriesTable.description,
        price: inventoriesTable.price,
        image: inventoriesTable.image,
        stock: sql<number | null>`${inventoriesTable.stock}`.as("stock"),
        itemType: sql<string>`'inventory'`.as("item_type"),
      })
      .from(inventoriesTable);
    const services = db
      .select({
        id: servicesTable.id,
        name: servicesTable.name,
        description: servicesTable.description,
        price: servicesTable.price,
        image: servicesTable.image,
        stock: sql<number | null>`null`.as("stock"),
        itemType: sql<string>`'service'`.as("item_type"),
      })
      .from(servicesTable);
    const bundlings = db
      .select({
        id: bundlingsTable.id,
        name: bundlingsTable.name,
        description: bundlingsTable.description,
        price: bundlingsTable.price,
        image: bundlingsTable.image,
        stock: sql<number | null>`null`.as("stock"),
        itemType: sql<string>`'bundling'`.as("item_type"),
      })
      .from(bundlingsTable);

    const rows = await unionAll(inventories, services, bundlings);

    await redis.set(POS_CACHE_KEY, JSON.stringify(rows), "EX", 3600);

    return rows;
  }
}
