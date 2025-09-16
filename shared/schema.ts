import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: text("item_type").notNull(),
  vendorName: text("vendor_name").notNull(),
  supplyDate: timestamp("supply_date").notNull(),
  warrantyPeriod: integer("warranty_period").notNull(), // in months
  warrantyExpiryDate: timestamp("warranty_expiry_date").notNull(),
  lastInspectionDate: timestamp("last_inspection_date"),
  conditionStatus: text("condition_status").default("good"),
  inspectionNotes: text("inspection_notes"),
  qrCodeUrl: text("qr_code_url"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  contactInfo: jsonb("contact_info"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  inspectorName: text("inspector_name"),
  condition: text("condition").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  warrantyExpiryDate: true,
  qrCodeUrl: true,
});

export const updateItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  // Override timestamp fields to accept strings (for JSON serialization)
  lastInspectionDate: z.union([z.string(), z.date()]).optional().nullable(),
  supplyDate: z.union([z.string(), z.date()]).optional(),
  warrantyExpiryDate: z.union([z.string(), z.date()]).optional(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
});

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type UpdateItem = z.infer<typeof updateItemSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

// Batch item creation schema
export const batchItemCreationSchema = z.object({
  itemType: z.string().min(1, "Item type is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  supplyDate: z.string().min(1, "Supply date is required"),
  warrantyPeriod: z.number().min(12).max(48),
  quantity: z.number().min(1).max(1000),
});

export type BatchItemCreation = z.infer<typeof batchItemCreationSchema>;

// AI Summary request schema
export const aiSummaryRequestSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  itemType: z.string().min(1, "Item type is required"),
  vendor: z.string().min(1, "Vendor is required"),
  supplyDate: z.union([z.string(), z.date()]),
  warrantyPeriod: z.number().min(0),
  lastInspection: z.union([z.string(), z.date(), z.null()]).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
});

export type AISummaryRequest = z.infer<typeof aiSummaryRequestSchema>;

// AI Summary response schema
export const aiSummaryResponseSchema = z.object({
  summary: z.string(),
  source: z.string().optional(),
  generated_at: z.string().optional(),
});

export type AISummaryResponse = z.infer<typeof aiSummaryResponseSchema>;
