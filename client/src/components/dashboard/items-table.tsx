import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useItems } from "@/hooks/use-items";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { generateItemReport } from "@/lib/pdf-utils";
import { downloadQRCodesAsZip } from "@/lib/qr-utils";
import type { Item } from "@shared/schema";

const itemTypeColors = {
  "wooden-sleeper": "bg-blue-100 text-blue-800",
  "concrete-sleeper": "bg-green-100 text-green-800",
  "rail-liner": "bg-purple-100 text-purple-800",
  "rail-pad": "bg-orange-100 text-orange-800",
  "elastic-rail-clip": "bg-pink-100 text-pink-800",
};

const itemTypeLabels = {
  "wooden-sleeper": "Wooden Sleeper",
  "concrete-sleeper": "Concrete Sleeper",
  "rail-liner": "Rail Liner",
  "rail-pad": "Rail Pad",
  "elastic-rail-clip": "Elastic Rail Clip",
};

interface Filters {
  itemType: string;
  condition: string;
  warrantyStatus: string;
  inspectionStatus: string;
  vendor: string;
}

export default function ItemsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    itemType: "all",
    condition: "all",
    warrantyStatus: "all",
    inspectionStatus: "all",
    vendor: "all"
  });

  const { data = [], isLoading, error } = useItems(); // Ensure data is always an array
  const { toast } = useToast();

  // Safe items array
  const items: Item[] = Array.isArray(data) ? data : [];

  // Filter logic
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || (
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesItemType = filters.itemType === "all" || item.itemType === filters.itemType;
    const matchesCondition = filters.condition === "all" || (item.conditionStatus || "good").toLowerCase() === filters.condition.toLowerCase();
    const matchesWarranty = filters.warrantyStatus === "all" || (item.warrantyExpiryDate && getWarrantyStatus(item.warrantyExpiryDate) === filters.warrantyStatus);
    const matchesInspection = filters.inspectionStatus === "all" || getInspectionStatusFilter(item.lastInspectionDate) === filters.inspectionStatus;
    const matchesVendor = filters.vendor === "all" || item.vendorName === filters.vendor;

    return matchesSearch && matchesItemType && matchesCondition && matchesWarranty && matchesInspection && matchesVendor;
  });

  function getWarrantyStatus(expiryDate: Date | string) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000*60*60*24));
    if (days < 0) return "expired";
    if (days <= 90) return "expiring-soon";
    return "valid";
  }

  function getInspectionStatusFilter(lastInspection: Date | string | null) {
    if (!lastInspection) return "never";
    const inspection = new Date(lastInspection);
    const now = new Date();
    const days = Math.ceil((now.getTime() - inspection.getTime()) / (1000*60*60*24));
    if (days > 180) return "overdue";
    if (days > 90) return "due-soon";
    return "current";
  }

  async function handleDownloadQR(item: Item) {
    try {
      const qrData = await api.getQRCode(item.id);
      const link = document.createElement("a");
      link.href = qrData.qrCode;
      link.download = `qr-${item.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Success", description: "QR code downloaded successfully!" });
    } catch {
      toast({ title: "Error", description: "Failed to download QR code", variant: "destructive" });
    }
  }

  async function handleGenerateReport(item: Item) {
    try {
      const aiSummary = await api.generateSummary({
        itemId: item.id,
        itemType: item.itemType,
        vendor: item.vendorName,
        supplyDate: item.supplyDate,
        warrantyPeriod: item.warrantyPeriod,
        lastInspection: item.lastInspectionDate,
        condition: item.conditionStatus,
      });
      await generateItemReport(item, aiSummary.summary);
      toast({ title: "Success", description: "Report generated successfully!" });
    } catch {
      await generateItemReport(item);
      toast({ title: "Report Generated", description: "Generated without AI summary" });
    }
  }

  if (error) {
    return (
      <Card><CardContent className="p-6 text-center text-destructive">Failed to load items. Please try again.</CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Track Fitting Inventory</h2>
        <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="p-6 text-center"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th><Checkbox checked={selectedItems.size === filteredItems.length} onCheckedChange={() => setSelectedItems(new Set())} /></th>
                  <th>Item ID</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Supply Date</th>
                  <th>Warranty Expiry</th>
                  <th>Inspection</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No items found.</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td><Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => {
                      const newSet = new Set(selectedItems);
                      newSet.has(item.id) ? newSet.delete(item.id) : newSet.add(item.id);
                      setSelectedItems(newSet);
                    }} /></td>
                    <td>{item.id}</td>
                    <td><span className={`px-2 py-1 rounded-full text-xs font-medium ${itemTypeColors[item.itemType as keyof typeof itemTypeColors] || "bg-gray-100 text-gray-800"}`}>{itemTypeLabels[item.itemType as keyof typeof itemTypeLabels] || item.itemType}</span></td>
                    <td>{item.vendorName}</td>
                    <td>{new Date(item.supplyDate).toLocaleDateString()}</td>
                    <td>{item.warrantyExpiryDate ? new Date(item.warrantyExpiryDate).toLocaleDateString() : "-"}</td>
                    <td>{item.lastInspectionDate ? new Date(item.lastInspectionDate).toLocaleDateString() : "Never"}</td>
                    <td className="flex gap-2">
                      <Link href={`/item/${item.id}`}><Button size="sm">View</Button></Link>
                      <Button size="sm" onClick={() => handleDownloadQR(item)}>QR</Button>
                      <Button size="sm" onClick={() => handleGenerateReport(item)}>PDF</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
