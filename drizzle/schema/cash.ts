import { pgTable, serial, varchar, numeric, integer, timestamp, boolean, jsonb, date } from "drizzle-orm/pg-core";

// Cash Customers Table
export const cashCustomers = pgTable("cash_customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  nationalId: varchar("national_id", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
});

// Cash Fruit Types Table
export const cashFruitTypes = pgTable("cash_fruit_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Daily Prices Table
export const cashDailyPrices = pgTable("cash_daily_prices", {
  id: serial("id").primaryKey(),
  fruitTypeId: integer("fruit_type_id").notNull().references(() => cashFruitTypes.id),
  priceDate: date("price_date").notNull(),
  pricePerKg: numeric("price_per_kg", { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  active: boolean("active").default(true).notNull(),
});

// Quality Thresholds Table
export const cashQualityThresholds = pgTable("cash_quality_thresholds", {
  id: serial("id").primaryKey(),
  fruitTypeId: integer("fruit_type_id").notNull().references(() => cashFruitTypes.id),
  metric: varchar("metric", { length: 32 }).notNull(),
  thresholdPercent: numeric("threshold_percent", { precision: 5, scale: 2 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Cash Receptions Table (Core Transaction)
export const cashReceptions = pgTable("cash_receptions", {
  id: serial("id").primaryKey(),
  fruitTypeId: integer("fruit_type_id").notNull().references(() => cashFruitTypes.id),
  customerId: integer("customer_id").notNull().references(() => cashCustomers.id),
  receptionDate: timestamp("reception_date", { withTimezone: true }).defaultNow().notNull(),
  containersCount: integer("containers_count").default(0).notNull(),
  totalWeightKgOriginal: numeric("total_weight_kg_original", { precision: 12, scale: 3 }).notNull(),
  pricePerKgSnapshot: numeric("price_per_kg_snapshot", { precision: 12, scale: 4 }).notNull(),
  calidadHumedad: numeric("calidad_humedad", { precision: 5, scale: 2 }),
  calidadMoho: numeric("calidad_moho", { precision: 5, scale: 2 }),
  calidadVioletas: numeric("calidad_violetas", { precision: 5, scale: 2 }),
  discountPercentTotal: numeric("discount_percent_total", { precision: 6, scale: 3 }).default("0").notNull(),
  discountWeightKg: numeric("discount_weight_kg", { precision: 12, scale: 3 }).default("0").notNull(),
  totalWeightKgFinal: numeric("total_weight_kg_final", { precision: 12, scale: 3 }).notNull(),
  grossAmount: numeric("gross_amount", { precision: 14, scale: 4 }).notNull(),
  netAmount: numeric("net_amount", { precision: 14, scale: 4 }).notNull(),
  discountBreakdown: jsonb("discount_breakdown").default("{}").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
});

// Unique constraint for quality thresholds (fruitType, metric)
export const cashQualityThresholdsUnique = pgTable("cash_quality_thresholds_unique", {
  fruitTypeId: integer("fruit_type_id").notNull().references(() => cashFruitTypes.id),
  metric: varchar("metric", { length: 32 }).notNull(),
});

// Export types for TypeScript
export type CashCustomer = typeof cashCustomers.$inferSelect;
export type NewCashCustomer = typeof cashCustomers.$inferInsert;

export type CashFruitType = typeof cashFruitTypes.$inferSelect;
export type NewCashFruitType = typeof cashFruitTypes.$inferInsert;

export type CashDailyPrice = typeof cashDailyPrices.$inferSelect;
export type NewCashDailyPrice = typeof cashDailyPrices.$inferInsert;

export type CashQualityThreshold = typeof cashQualityThresholds.$inferSelect;
export type NewCashQualityThreshold = typeof cashQualityThresholds.$inferInsert;

export type CashReception = typeof cashReceptions.$inferSelect;
export type NewCashReception = typeof cashReceptions.$inferInsert;