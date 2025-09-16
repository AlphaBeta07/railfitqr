import { drizzle } from "drizzle-orm/neon-serverless";
import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";

config();

// 1️⃣ Connect to Neon Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL as string,
});
const db = drizzle(pool);

// 2️⃣ Define Tables Schema
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: text("item_type").notNull(),
  vendorName: text("vendor_name").notNull(),
  supplyDate: timestamp("supply_date").notNull(),
  warrantyPeriod: integer("warranty_period").notNull(),
  warrantyExpiryDate: timestamp("warranty_expiry_date"),
  lastInspectionDate: timestamp("last_inspection_date"),
  conditionStatus: text("condition_status"),
  inspectionNotes: text("inspection_notes"),
  qrCodeUrl: text("qr_code_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: uuid("item_id").notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3️⃣ Run Migration
async function migrate() {
  console.log("⚡️ Running migration...");

  // Ensure UUID generation extension is enabled
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // Create tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      contact_info TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_type TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      supply_date TIMESTAMP NOT NULL,
      warranty_period INT NOT NULL,
      warranty_expiry_date TIMESTAMP,
      last_inspection_date TIMESTAMP,
      condition_status TEXT,
      inspection_notes TEXT,
      qr_code_url TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS inspections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      inspection_date TIMESTAMP NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `);

  console.log("✅ Tables created successfully!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
