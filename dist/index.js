var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiSummaryRequestSchema: () => aiSummaryRequestSchema,
  aiSummaryResponseSchema: () => aiSummaryResponseSchema,
  batchItemCreationSchema: () => batchItemCreationSchema,
  insertInspectionSchema: () => insertInspectionSchema,
  insertItemSchema: () => insertItemSchema,
  insertVendorSchema: () => insertVendorSchema,
  inspections: () => inspections,
  items: () => items,
  updateItemSchema: () => updateItemSchema,
  vendors: () => vendors
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: text("item_type").notNull(),
  vendorName: text("vendor_name").notNull(),
  supplyDate: timestamp("supply_date").notNull(),
  warrantyPeriod: integer("warranty_period").notNull(),
  // in months
  warrantyExpiryDate: timestamp("warranty_expiry_date").notNull(),
  lastInspectionDate: timestamp("last_inspection_date"),
  conditionStatus: text("condition_status").default("good"),
  inspectionNotes: text("inspection_notes"),
  qrCodeUrl: text("qr_code_url"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  contactInfo: jsonb("contact_info"),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  inspectorName: text("inspector_name"),
  condition: text("condition").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  warrantyExpiryDate: true,
  qrCodeUrl: true
});
var updateItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial().extend({
  // Override timestamp fields to accept strings (for JSON serialization)
  lastInspectionDate: z.union([z.string(), z.date()]).optional().nullable(),
  supplyDate: z.union([z.string(), z.date()]).optional(),
  warrantyExpiryDate: z.union([z.string(), z.date()]).optional()
});
var insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true
});
var insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true
});
var batchItemCreationSchema = z.object({
  itemType: z.string().min(1, "Item type is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  supplyDate: z.string().min(1, "Supply date is required"),
  warrantyPeriod: z.number().min(12).max(48),
  quantity: z.number().min(1).max(1e3)
});
var aiSummaryRequestSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  itemType: z.string().min(1, "Item type is required"),
  vendor: z.string().min(1, "Vendor is required"),
  supplyDate: z.union([z.string(), z.date()]),
  warrantyPeriod: z.number().min(0),
  lastInspection: z.union([z.string(), z.date(), z.null()]).optional(),
  condition: z.enum(["excellent", "good", "fair", "poor"]).optional()
});
var aiSummaryResponseSchema = z.object({
  summary: z.string(),
  source: z.string().optional(),
  generated_at: z.string().optional()
});

// server/db.ts
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { config } from "dotenv";
config();
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });
console.log("\u2705 Connected to Neon database");

// server/storage.ts
import { eq, and, lte, gt, sql as sql2, count } from "drizzle-orm";
var DatabaseStorage = class {
  // ---------------- ITEMS ----------------
  async getItems() {
    return await db.select().from(items);
  }
  async getItem(id) {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }
  async createItem(insertItem) {
    const warrantyExpiryDate = new Date(insertItem.supplyDate);
    warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + insertItem.warrantyPeriod);
    const [item] = await db.insert(items).values({
      ...insertItem,
      warrantyExpiryDate,
      qrCodeUrl: null
    }).returning();
    const [updatedItem] = await db.update(items).set({ qrCodeUrl: `/api/qr/${item.id}` }).where(eq(items.id, item.id)).returning();
    return updatedItem;
  }
  async updateItem(id, updateItem) {
    const [updatedItem] = await db.update(items).set({
      ...updateItem,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(items.id, id)).returning();
    return updatedItem;
  }
  async deleteItem(id) {
    const result = await db.delete(items).where(eq(items.id, id));
    return result.length > 0;
  }
  // ---------------- VENDORS ----------------
  async getVendors() {
    return await db.select().from(vendors);
  }
  async getVendor(id) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }
  async getVendorByName(name) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.name, name));
    return vendor;
  }
  async createVendor(insertVendor) {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }
  // ---------------- INSPECTIONS ----------------
  async getInspections() {
    return await db.select().from(inspections);
  }
  async getInspectionsByItemId(itemId) {
    return await db.select().from(inspections).where(eq(inspections.itemId, itemId));
  }
  async createInspection(insertInspection) {
    const [inspection] = await db.insert(inspections).values(insertInspection).returning();
    return inspection;
  }
  // ---------------- STATISTICS ----------------
  async getStats() {
    const now = /* @__PURE__ */ new Date();
    const ninetyDaysFromNow = /* @__PURE__ */ new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    const sixMonthsAgo = /* @__PURE__ */ new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const [totalItemsResult] = await db.select({ count: count() }).from(items);
    const [warrantyExpiringResult] = await db.select({ count: count() }).from(items).where(and(
      lte(items.warrantyExpiryDate, ninetyDaysFromNow),
      gt(items.warrantyExpiryDate, now)
    ));
    const [inspectionsOverdueResult] = await db.select({ count: count() }).from(items).where(sql2`${items.lastInspectionDate} IS NULL OR ${items.lastInspectionDate} < ${sixMonthsAgo.toISOString()}`);
    const [activeVendorsResult] = await db.select({ count: count() }).from(vendors);
    return {
      totalItems: Number(totalItemsResult.count),
      warrantyExpiring: Number(warrantyExpiringResult.count),
      inspectionsOverdue: Number(inspectionsOverdueResult.count),
      activeVendors: Number(activeVendorsResult.count)
    };
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import QRCode from "qrcode";
async function registerRoutes(app2) {
  app2.get("/api/items", async (req, res) => {
    try {
      const items2 = await storage.getItems();
      res.json(items2);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  app2.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });
  app2.post("/api/items", async (req, res) => {
    try {
      const validatedData = batchItemCreationSchema.parse(req.body);
      let vendor = await storage.getVendorByName(validatedData.vendorName);
      if (!vendor) {
        vendor = await storage.createVendor({
          name: validatedData.vendorName,
          contactInfo: null
        });
      }
      const createdItems = [];
      for (let i = 0; i < validatedData.quantity; i++) {
        const item = await storage.createItem({
          itemType: validatedData.itemType,
          vendorName: validatedData.vendorName,
          supplyDate: new Date(validatedData.supplyDate),
          warrantyPeriod: validatedData.warrantyPeriod,
          lastInspectionDate: null,
          conditionStatus: "good",
          inspectionNotes: null
        });
        createdItems.push(item);
      }
      res.json({ items: createdItems, count: createdItems.length });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) res.status(400).json({ message: error.message });
      else res.status(500).json({ message: "Failed to create items" });
    }
  });
  app2.put("/api/items/:id", async (req, res) => {
    try {
      const validatedData = updateItemSchema.parse(req.body);
      const processedData = {};
      if (validatedData.itemType !== void 0) processedData.itemType = validatedData.itemType;
      if (validatedData.vendorName !== void 0) processedData.vendorName = validatedData.vendorName;
      if (validatedData.warrantyPeriod !== void 0) processedData.warrantyPeriod = validatedData.warrantyPeriod;
      if (validatedData.conditionStatus !== void 0) processedData.conditionStatus = validatedData.conditionStatus;
      if (validatedData.inspectionNotes !== void 0) processedData.inspectionNotes = validatedData.inspectionNotes;
      if (validatedData.qrCodeUrl !== void 0) processedData.qrCodeUrl = validatedData.qrCodeUrl;
      if (validatedData.lastInspectionDate !== void 0)
        processedData.lastInspectionDate = validatedData.lastInspectionDate ? new Date(validatedData.lastInspectionDate) : null;
      if (validatedData.supplyDate !== void 0)
        processedData.supplyDate = validatedData.supplyDate ? new Date(validatedData.supplyDate) : null;
      if (validatedData.warrantyExpiryDate !== void 0)
        processedData.warrantyExpiryDate = validatedData.warrantyExpiryDate ? new Date(validatedData.warrantyExpiryDate) : null;
      const updatedItem = await storage.updateItem(req.params.id, processedData);
      if (!updatedItem) return res.status(404).json({ message: "Item not found" });
      res.json(updatedItem);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) res.status(400).json({ message: error.message });
      else res.status(500).json({ message: "Failed to update item" });
    }
  });
  app2.get("/api/qr/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      const qrData = { id: item.id, type: item.itemType, vendor: item.vendorName };
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
      res.json({ qrCode: qrCodeDataURL, data: qrData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });
  app2.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.get("/api/vendors", async (req, res) => {
    try {
      const vendors2 = await storage.getVendors();
      res.json(vendors2);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });
  app2.post("/api/inspections", async (req, res) => {
    try {
      const validatedData = insertInspectionSchema.parse(req.body);
      const inspection = await storage.createInspection(validatedData);
      await storage.updateItem(validatedData.itemId, { lastInspectionDate: validatedData.inspectionDate });
      res.json(inspection);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) res.status(400).json({ message: error.message });
      else res.status(500).json({ message: "Failed to create inspection" });
    }
  });
  app2.post("/api/ai/generate-summary", async (req, res) => {
    let validatedData;
    try {
      validatedData = aiSummaryRequestSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ message: "Invalid request data" });
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5e3);
      const response = await fetch("https://raildash.onrender.com/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const data = await response.json();
      const validatedResponse = aiSummaryResponseSchema.parse(data);
      res.json(validatedResponse);
    } catch (error) {
      console.log("AI service unavailable, using local fallback");
      const { itemId, itemType, vendor, supplyDate, warrantyPeriod, lastInspection, condition } = validatedData;
      const supplyAge = Math.floor((Date.now() - new Date(supplyDate).getTime()) / (1e3 * 60 * 60 * 24 * 30));
      const warrantyRemaining = warrantyPeriod - supplyAge;
      const lastInspectionAge = lastInspection ? Math.floor((Date.now() - new Date(lastInspection).getTime()) / (1e3 * 60 * 60 * 24)) : null;
      let summary = `Item Analysis Report for ${itemId}:

`;
      summary += `This ${itemType.replace("-", " ")} was supplied by ${vendor} approximately ${supplyAge} months ago. `;
      summary += warrantyRemaining > 0 ? `The item is currently under warranty with ${warrantyRemaining} months remaining. ` : `The warranty period has expired ${Math.abs(warrantyRemaining)} months ago. `;
      const conditionLower = condition?.toLowerCase();
      if (conditionLower === "excellent") summary += `The current condition is excellent. `;
      else if (conditionLower === "good") summary += `The current condition is good. `;
      else if (conditionLower === "fair") summary += `The condition is fair, consider monitoring. `;
      else if (conditionLower === "poor") summary += `The condition is poor, immediate attention required. `;
      if (lastInspectionAge !== null) {
        if (lastInspectionAge < 30) summary += `Recent inspection (${lastInspectionAge} days ago) indicates proactive maintenance. `;
        else if (lastInspectionAge < 90) summary += `Last inspection was ${lastInspectionAge} days ago, within acceptable intervals. `;
        else summary += `Last inspection was ${lastInspectionAge} days ago, schedule new inspection soon. `;
      } else {
        summary += `No inspection record found. `;
      }
      const localResponse = {
        summary,
        source: "local_analysis",
        generated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const validatedLocalResponse = aiSummaryResponseSchema.parse(localResponse);
      res.json(validatedLocalResponse);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
import path3 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathReq.startsWith("/api")) {
      let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    console.log("Serving frontend from:", path3.join(__dirname, "public"));
    app.use(express2.static(path3.join(__dirname, "public")));
    app.get("*", (req, res) => {
      res.sendFile(path3.join(__dirname, "public", "index.html"));
    });
  }
  const PORT = process.env.PORT || 1e4;
  app.listen(
    PORT,
    "0.0.0.0",
    () => console.log(`Serving on http://0.0.0.0:${PORT}`)
  );
})();
