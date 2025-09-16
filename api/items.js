import { storage } from "../../server/storage";
import { batchItemCreationSchema } from "../../shared/schema";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const items = await storage.getItems();
      res.status(200).json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  } else if (req.method === "POST") {
    try {
      const validatedData = batchItemCreationSchema.parse(JSON.parse(req.body));
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

      res.status(201).json({ items: createdItems, count: createdItems.length });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
