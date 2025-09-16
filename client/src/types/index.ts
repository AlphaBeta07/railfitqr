export interface KPIStats {
  totalItems: number;
  warrantyExpiring: number;
  inspectionsOverdue: number;
  activeVendors: number;
}

export interface QRCodeData {
  qrCode: string;
  data: {
    id: string;
    type: string;
    vendor: string;
  };
}

export interface BatchCreateResponse {
  items: any[];
  count: number;
}

export type ItemType = 
  | "wooden-sleeper"
  | "concrete-sleeper" 
  | "rail-liner"
  | "rail-pad"
  | "elastic-rail-clip";

export type ConditionStatus = "excellent" | "good" | "fair" | "poor";

export interface VendorPerformance {
  vendor: string;
  itemCount: number;
}

export interface ItemTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface Anomaly {
  id: string;
  type: "warranty-expiring" | "inspection-overdue" | "supply-pattern";
  title: string;
  description: string;
  itemId?: string;
  severity: "low" | "medium" | "high";
  detectedAt: Date;
}
