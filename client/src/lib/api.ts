import { apiRequest } from "./queryClient";
import type { BatchItemCreation, Item, UpdateItem, Inspection, InsertInspection } from "@shared/schema";
import type { KPIStats, QRCodeData, BatchCreateResponse } from "@/types";

export const api = {
  // Items
  getItems: (): Promise<Item[]> => 
    fetch("/api/items").then(res => res.json()),

  getItem: (id: string): Promise<Item> =>
    fetch(`/api/items/${id}`).then(res => res.json()),

  createItems: async (data: BatchItemCreation): Promise<BatchCreateResponse> => {
    const res = await apiRequest("POST", "/api/items", data);
    return res.json();
  },

  updateItem: async (id: string, data: UpdateItem): Promise<Item> => {
    const res = await apiRequest("PUT", `/api/items/${id}`, data);
    return res.json();
  },

  // QR Codes
  getQRCode: (id: string): Promise<QRCodeData> =>
    fetch(`/api/qr/${id}`).then(res => res.json()),

  // Statistics
  getStats: (): Promise<KPIStats> =>
    fetch("/api/stats").then(res => res.json()),

  // Vendors
  getVendors: () =>
    fetch("/api/vendors").then(res => res.json()),

  // Inspections
  createInspection: async (data: InsertInspection): Promise<Inspection> => {
    const res = await apiRequest("POST", "/api/inspections", data);
    return res.json();
  },

  // AI
  generateSummary: async (data: any): Promise<any> => {
    const res = await apiRequest("POST", "/api/ai/generate-summary", data);
    return res.json();
  },
};
