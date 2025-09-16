import { storage } from "../../server/storage";
import { updateItemSchema } from "../../shared/schema";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const item = await storage.getItem(id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.status(200).json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  } else if (req.method === "PUT") {
    try {
      const validatedData = updateItemSchema.parse(JSON.parse(req.body));

      const processedData = {};
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

      const updatedItem = await storage.updateItem(id, processedData);
      if (!updatedItem) return res.status(404).json({ message: "Item not found" });

      res.status(200).json(updatedItem);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const deleted = await storage.deleteItem(id);
      if (!deleted) return res.status(404).json({ message: "Item not found" });
      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
