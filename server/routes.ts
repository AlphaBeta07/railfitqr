// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  batchItemCreationSchema,
  insertItemSchema,
  updateItemSchema,
  insertInspectionSchema,
  aiSummaryRequestSchema,
  aiSummaryResponseSchema,
} from "@shared/schema";
import QRCode from "qrcode";

// Register all routes
export async function registerRoutes(app: Express): Promise<Server> {
  // ---------------- ITEMS ----------------
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const validatedData = batchItemCreationSchema.parse(req.body);

      // Ensure vendor exists
      let vendor = await storage.getVendorByName(validatedData.vendorName);
      if (!vendor) {
        vendor = await storage.createVendor({
          name: validatedData.vendorName,
          contactInfo: null,
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
          inspectionNotes: null,
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

  app.put("/api/items/:id", async (req, res) => {
    try {
      const validatedData = updateItemSchema.parse(req.body);

      // Prepare update data
      const processedData: any = {};
      if (validatedData.itemType !== undefined) processedData.itemType = validatedData.itemType;
      if (validatedData.vendorName !== undefined) processedData.vendorName = validatedData.vendorName;
      if (validatedData.warrantyPeriod !== undefined) processedData.warrantyPeriod = validatedData.warrantyPeriod;
      if (validatedData.conditionStatus !== undefined) processedData.conditionStatus = validatedData.conditionStatus;
      if (validatedData.inspectionNotes !== undefined) processedData.inspectionNotes = validatedData.inspectionNotes;
      if (validatedData.qrCodeUrl !== undefined) processedData.qrCodeUrl = validatedData.qrCodeUrl;

      if (validatedData.lastInspectionDate !== undefined)
        processedData.lastInspectionDate = validatedData.lastInspectionDate ? new Date(validatedData.lastInspectionDate) : null;
      if (validatedData.supplyDate !== undefined)
        processedData.supplyDate = validatedData.supplyDate ? new Date(validatedData.supplyDate) : null;
      if (validatedData.warrantyExpiryDate !== undefined)
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

  // ---------------- QR CODE ----------------
  app.get("/api/qr/:id", async (req, res) => {
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

  // ---------------- STATISTICS ----------------
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // ---------------- VENDORS ----------------
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // ---------------- INSPECTIONS ----------------
  app.post("/api/inspections", async (req, res) => {
    try {
      const validatedData = insertInspectionSchema.parse(req.body);
      const inspection = await storage.createInspection(validatedData);

      // Update item's last inspection date
      await storage.updateItem(validatedData.itemId, { lastInspectionDate: validatedData.inspectionDate });

      res.json(inspection);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) res.status(400).json({ message: error.message });
      else res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  // ---------------- AI SUMMARY ----------------
  app.post("/api/ai/generate-summary", async (req, res) => {
    let validatedData;
    try {
      validatedData = aiSummaryRequestSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    try {
      // External AI service
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://raildash.onrender.com/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`AI service returned ${response.status}`);

      const data = await response.json();
      const validatedResponse = aiSummaryResponseSchema.parse(data);
      res.json(validatedResponse);
    } catch (error) {
      console.log("AI service unavailable, using local fallback");

      const { itemId, itemType, vendor, supplyDate, warrantyPeriod, lastInspection, condition } = validatedData;

      const supplyAge = Math.floor((Date.now() - new Date(supplyDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
      const warrantyRemaining = warrantyPeriod - supplyAge;
      const lastInspectionAge = lastInspection ? Math.floor((Date.now() - new Date(lastInspection).getTime()) / (1000 * 60 * 60 * 24)) : null;

      let summary = `Item Analysis Report for ${itemId}:\n\n`;
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
        generated_at: new Date().toISOString(),
      };
      const validatedLocalResponse = aiSummaryResponseSchema.parse(localResponse);
      res.json(validatedLocalResponse);
    }
  });

  // ---------------- HTTP SERVER ----------------
  const httpServer = createServer(app);
  return httpServer;
}
