import { storage } from "../../server/storage";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const vendors = await storage.getVendors();
      res.status(200).json(vendors);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
