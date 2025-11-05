import { pgTable, uuid, varchar, text, boolean, timestamp, date, time, integer, numeric, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Import cash domain schemas
export * from '../../drizzle/schema/cash';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Asociaciones table
export const asociaciones = pgTable('asociaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Certifications table
export const certifications = pgTable('certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Providers table
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 255 }),
  address: text('address'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  asociacionId: uuid('asociacion_id').references(() => asociaciones.id),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Provider certifications junction table
export const providerCertifications = pgTable('provider_certifications', {
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  certificationId: uuid('certification_id').references(() => certifications.id).notNull(),
  issuedDate: date('issued_date'),
  expiryDate: date('expiry_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey(table.providerId, table.certificationId),
}));

// Drivers table
export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  licenseNumber: varchar('license_number', { length: 255 }),
  phone: varchar('phone', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Fruit types table
export const fruitTypes = pgTable('fruit_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 255 }).notNull(),
  subtype: varchar('subtype', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Pricing rules table
export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  fruitType: varchar('fruit_type', { length: 255 }).notNull(),
  qualityBasedPricingEnabled: boolean('quality_based_pricing_enabled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// Discount thresholds table
export const discountThresholds = pgTable('discount_thresholds', {
  id: uuid('id').primaryKey().defaultRandom(),
  pricingRuleId: uuid('pricing_rule_id').references(() => pricingRules.id).notNull(),
  qualityMetric: varchar('quality_metric', { length: 255 }).notNull(),
  limitValue: numeric('limit_value', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

// Daily prices table for regular receptions
export const dailyPrices = pgTable('daily_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  fruitTypeId: uuid('fruit_type_id').references(() => fruitTypes.id).notNull(),
  priceDate: date('price_date').notNull(),
  pricePerKg: numeric('price_per_kg', { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  active: boolean('active').default(true).notNull(),
});

// Cacao batches table
export const cacaoBatches = pgTable('cacao_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchType: text('batch_type').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  duration: integer('duration').notNull(),
  totalWetWeight: numeric('total_wet_weight'),
  totalDriedWeight: numeric('total_dried_weight'),
  status: text('status').default('In progress').notNull(),
  expectedCompletionDate: timestamp('expected_completion_date', { withTimezone: true }),
  totalSacos70kg: integer('total_sacos_70kg'),
  remainderKg: numeric('remainder_kg'),
});

// Receptions table
export const receptions = pgTable('receptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  receptionNumber: varchar('reception_number', { length: 255 }).notNull(),
  providerId: uuid('provider_id').references(() => providers.id).notNull(),
  driverId: uuid('driver_id').references(() => drivers.id).notNull(),
  truckPlate: varchar('truck_plate', { length: 255 }).notNull(),
  totalContainers: integer('total_containers').notNull(),
  receptionDate: date('reception_date').defaultNow().notNull(),
  receptionTime: time('reception_time').defaultNow().notNull(),
  status: varchar('status', { length: 255 }).default('draft'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  fruitTypeId: uuid('fruit_type_id').references(() => fruitTypes.id),
  syncedToDashboard: boolean('synced_to_dashboard').default(false).notNull(),
  pricingCalculationId: uuid('pricing_calculation_id').references(() => pricingCalculations.id),
  totalPesoOriginal: numeric('total_peso_original').default('0'),
  totalPesoDescuento: numeric('total_peso_descuento').default('0'),
  totalPesoFinal: numeric('total_peso_final').default('0'),
  labSampleWetWeight: numeric('lab_sample_wet_weight'),
  labSampleDriedWeight: numeric('lab_sample_dried_weight'),
  totalPesoDried: numeric('total_peso_dried'),
  fBatchId: uuid('f_batch_id').references(() => cacaoBatches.id),
});

// Reception details table
export const receptionDetails = pgTable('reception_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  receptionId: uuid('reception_id').references(() => receptions.id).notNull(),
  fruitTypeId: uuid('fruit_type_id').references(() => fruitTypes.id).notNull(),
  quantity: integer('quantity').notNull(),
  weightKg: numeric('weight_kg').notNull(),
  lineNumber: integer('line_number').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  originalWeight: numeric('original_weight').default('0'),
  discountedWeight: numeric('discounted_weight').default('0'),
  discountPercentage: numeric('discount_percentage').default('0'),
  labSampleAdjustment: numeric('lab_sample_adjustment').default('0'),
});

// Quality evaluations table (general)
export const qualityEvaluations = pgTable('quality_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  recepcionId: uuid('recepcion_id').references(() => receptions.id).notNull(),
  violetas: numeric('violetas'),
  humedad: numeric('humedad'),
  moho: numeric('moho'),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Calidad cafe table (coffee-specific quality evaluations)
export const calidadCafe = pgTable('calidad_cafe', {
  id: uuid('id').primaryKey().defaultRandom(),
  recepcionId: uuid('recepcion_id').references(() => receptions.id).notNull(),
  violetas: numeric('violetas').notNull(),
  humedad: numeric('humedad').notNull(),
  moho: numeric('moho').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Laboratory samples table
export const laboratorySamples = pgTable('laboratory_samples', {
  id: uuid('id').primaryKey().defaultRandom(),
  receptionId: uuid('reception_id').references(() => receptions.id),
  sampleWeight: numeric('sample_weight').notNull(),
  estimatedDryingDays: integer('estimated_drying_days').notNull(),
  status: text('status').default('Drying').notNull(),
  driedSampleKg: numeric('dried_sample_kg'),
  violetasPercentage: numeric('violetas_percentage'),
  mohoPercentage: numeric('moho_percentage'),
  basuraPercentage: numeric('basura_percentage'),
});

// Pricing calculations table
export const pricingCalculations = pgTable('pricing_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  receptionId: uuid('reception_id').references(() => receptions.id).notNull(),
  basePricePerKg: numeric('base_price_per_kg').notNull(),
  totalWeight: numeric('total_weight').notNull(),
  grossValue: numeric('gross_value').notNull(),
  totalDiscountAmount: numeric('total_discount_amount').default('0').notNull(),
  finalTotal: numeric('final_total').notNull(),
  calculationData: jsonb('calculation_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Weight discount calculations table
export const weightDiscountCalculations = pgTable('weight_discount_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  receptionId: uuid('reception_id').references(() => receptions.id).notNull(),
  calculationData: jsonb('calculation_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
});

// Desglose descuentos table
export const desgloseDescuentos = pgTable('desglose_descuentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  recepcionId: uuid('recepcion_id').references(() => receptions.id).notNull(),
  parametro: varchar('parametro', { length: 255 }).notNull(),
  umbral: numeric('umbral').notNull(),
  valor: numeric('valor').notNull(),
  porcentajeDescuento: numeric('porcentaje_descuento').notNull(),
  pesoDescuento: numeric('peso_descuento').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
});

// Batch receptions junction table
export const batchReceptions = pgTable('batch_receptions', {
  batchId: uuid('batch_id').references(() => cacaoBatches.id).notNull(),
  receptionId: uuid('reception_id').references(() => receptions.id).notNull(),
  wetWeightContribution: numeric('wet_weight_contribution'),
  percentageOfTotal: numeric('percentage_of_total'),
  proportionalDriedWeight: numeric('proportional_dried_weight'),
}, (table) => ({
  pk: primaryKey(table.batchId, table.receptionId),
}));

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(),
  tableName: varchar('table_name', { length: 255 }),
  recordId: uuid('record_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  createdUsers: many(users, { relationName: 'createdBy' }),
  createdByUser: one(users, { fields: [users.createdBy], references: [users.id], relationName: 'createdBy' }),
  createdProviders: many(providers),
  createdDrivers: many(drivers),
  createdReceptions: many(receptions),
  createdQualityEvaluations: many(qualityEvaluations),
  updatedQualityEvaluations: many(qualityEvaluations),
  createdPricingRules: many(pricingRules),
  updatedPricingRules: many(pricingRules),
  createdDiscountThresholds: many(discountThresholds),
  updatedDiscountThresholds: many(discountThresholds),
  createdPricingCalculations: many(pricingCalculations),
  createdWeightDiscountCalculations: many(weightDiscountCalculations),
  createdDesgloseDescuentos: many(desgloseDescuentos),
  auditLogs: many(auditLogs),
}));

export const asociacionesRelations = relations(asociaciones, ({ many }) => ({
  providers: many(providers),
}));

export const certificationsRelations = relations(certifications, ({ many }) => ({
  providerCertifications: many(providerCertifications),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  asociacion: one(asociaciones, { fields: [providers.asociacionId], references: [asociaciones.id] }),
  createdBy: one(users, { fields: [providers.createdBy], references: [users.id] }),
  receptions: many(receptions),
  providerCertifications: many(providerCertifications),
}));

export const providerCertificationsRelations = relations(providerCertifications, ({ one }) => ({
  provider: one(providers, { fields: [providerCertifications.providerId], references: [providers.id] }),
  certification: one(certifications, { fields: [providerCertifications.certificationId], references: [certifications.id] }),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  createdBy: one(users, { fields: [drivers.createdBy], references: [users.id] }),
  receptions: many(receptions),
}));

export const fruitTypesRelations = relations(fruitTypes, ({ many }) => ({
  receptionDetails: many(receptionDetails),
  receptions: many(receptions),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one, many }) => ({
  createdBy: one(users, { fields: [pricingRules.createdBy], references: [users.id] }),
  updatedBy: one(users, { fields: [pricingRules.updatedBy], references: [users.id] }),
  discountThresholds: many(discountThresholds),
}));

export const discountThresholdsRelations = relations(discountThresholds, ({ one }) => ({
  pricingRule: one(pricingRules, { fields: [discountThresholds.pricingRuleId], references: [pricingRules.id] }),
  createdBy: one(users, { fields: [discountThresholds.createdBy], references: [users.id] }),
  updatedBy: one(users, { fields: [discountThresholds.updatedBy], references: [users.id] }),
}));

export const cacaoBatchesRelations = relations(cacaoBatches, ({ many }) => ({
  receptions: many(receptions),
  batchReceptions: many(batchReceptions),
}));

export const receptionsRelations = relations(receptions, ({ one, many }) => ({
  provider: one(providers, { fields: [receptions.providerId], references: [providers.id] }),
  driver: one(drivers, { fields: [receptions.driverId], references: [drivers.id] }),
  createdBy: one(users, { fields: [receptions.createdBy], references: [users.id] }),
  fruitType: one(fruitTypes, { fields: [receptions.fruitTypeId], references: [fruitTypes.id] }),
  pricingCalculation: one(pricingCalculations, { fields: [receptions.pricingCalculationId], references: [pricingCalculations.id] }),
  cacaoBatch: one(cacaoBatches, { fields: [receptions.fBatchId], references: [cacaoBatches.id] }),
  receptionDetails: many(receptionDetails),
  qualityEvaluations: many(qualityEvaluations),
  laboratorySamples: many(laboratorySamples),
  weightDiscountCalculations: many(weightDiscountCalculations),
  desgloseDescuentos: many(desgloseDescuentos),
  batchReceptions: many(batchReceptions),
}));

export const receptionDetailsRelations = relations(receptionDetails, ({ one }) => ({
  reception: one(receptions, { fields: [receptionDetails.receptionId], references: [receptions.id] }),
  fruitType: one(fruitTypes, { fields: [receptionDetails.fruitTypeId], references: [fruitTypes.id] }),
}));

export const qualityEvaluationsRelations = relations(qualityEvaluations, ({ one }) => ({
  reception: one(receptions, { fields: [qualityEvaluations.recepcionId], references: [receptions.id] }),
  createdBy: one(users, { fields: [qualityEvaluations.createdBy], references: [users.id] }),
  updatedBy: one(users, { fields: [qualityEvaluations.updatedBy], references: [users.id] }),
}));

export const calidadCafeRelations = relations(calidadCafe, ({ one }) => ({
  reception: one(receptions, { fields: [calidadCafe.recepcionId], references: [receptions.id] }),
  createdBy: one(users, { fields: [calidadCafe.createdBy], references: [users.id] }),
  updatedBy: one(users, { fields: [calidadCafe.updatedBy], references: [users.id] }),
}));

export const laboratorySamplesRelations = relations(laboratorySamples, ({ one }) => ({
  reception: one(receptions, { fields: [laboratorySamples.receptionId], references: [receptions.id] }),
}));

export const pricingCalculationsRelations = relations(pricingCalculations, ({ one, many }) => ({
  reception: one(receptions, { fields: [pricingCalculations.receptionId], references: [receptions.id] }),
  createdBy: one(users, { fields: [pricingCalculations.createdBy], references: [users.id] }),
}));

export const weightDiscountCalculationsRelations = relations(weightDiscountCalculations, ({ one }) => ({
  reception: one(receptions, { fields: [weightDiscountCalculations.receptionId], references: [receptions.id] }),
  createdBy: one(users, { fields: [weightDiscountCalculations.createdBy], references: [users.id] }),
}));

export const desgloseDescuentosRelations = relations(desgloseDescuentos, ({ one }) => ({
  reception: one(receptions, { fields: [desgloseDescuentos.recepcionId], references: [receptions.id] }),
  createdBy: one(users, { fields: [desgloseDescuentos.createdBy], references: [users.id] }),
}));

export const batchReceptionsRelations = relations(batchReceptions, ({ one }) => ({
  batch: one(cacaoBatches, { fields: [batchReceptions.batchId], references: [cacaoBatches.id] }),
  reception: one(receptions, { fields: [batchReceptions.receptionId], references: [receptions.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));