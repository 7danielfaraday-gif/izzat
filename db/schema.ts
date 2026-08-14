import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const productCatalog = sqliteTable("product_catalog", {
  id: integer("id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull(),
});
