# AI Agent Prompt: Inventory Dashboard & Analytics Implementation

**Context:**
I am building a laundry management system for my thesis using **Elysia.js**, **Drizzle ORM**, and **PostgreSQL**. The inventory system treats each item as a discrete sachet (1 unit = 1 sachet). I need to implement a dashboard backend that provides data for the UI seen in `Frame 1.png`.

**Objectives:**
1. Add a new static method `getInventoryReport` to the `Inventories` class in `service.ts`.
2. Add a new `GET /report` endpoint to the `inventoriesController` in `index.ts`.
3. Update the `inventoriesModel` in `model.ts` to include the query schema for the report.

**Logic Requirements:**
Implement the following metrics for the dashboard:
* **Total Items:** Count all records in the `inventories` table.
* **Low Stock Items:** Count records where `stock <= safetyStock`.
* **Total Usage:** Sum of `abs(changeAmount)` from `stockLogs` where `type = 'order'` within the requested date range.
* **Average Usage/Order:** `Total Usage` divided by the count of unique `orderId` in `stockLogs` within the range.

**Technical Specifications:**
1. **Date Filtering:** Use `from` and `to` as equal as in sales service.
2. **Aggregation:** Use Drizzle's `sql`, `sum`, `count`, and `countDistinct`.
3. **Safety First:** Handle "Division by Zero" cases for `Average Usage/Order` and `daysRemaining` by returning 0 or a "N/A" string.
4. **Schema Consistency:** Ensure no reference to `unit` or `quantityPerUnit` as they have been removed.

**Implementation Steps:**
* **Service:** Create the logic in `service.ts`. Use `Promise.all` to fetch statistics and the table list in parallel.
* **Controller:** Register the `/report` route in `index.ts`. Ensure it is guarded and parses query parameters correctly.
