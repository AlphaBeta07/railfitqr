import jsPDF from "jspdf";
import type { Item } from "@shared/schema";

export const generateItemReport = async (item: Item, aiSummary?: string): Promise<void> => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(33, 37, 41);
  pdf.text("RailVision - Item Report", 20, 30);
  
  // Railway logo placeholder
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Indian Railways", 20, 40);
  
  // AI Summary Section (if available)
  if (aiSummary) {
    pdf.setFontSize(16);
    pdf.setTextColor(33, 37, 41);
    pdf.text("AI Summary", 20, 60);
    
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const summaryLines = pdf.splitTextToSize(aiSummary, 170);
    pdf.text(summaryLines, 20, 70);
  }
  
  // Item Details Section
  const startY = aiSummary ? 110 : 60;
  
  pdf.setFontSize(16);
  pdf.setTextColor(33, 37, 41);
  pdf.text("Item Details", 20, startY);
  
  // Create table data
  const details = [
    ["Item ID", item.id],
    ["Type", item.itemType],
    ["Vendor", item.vendorName],
    ["Supply Date", new Date(item.supplyDate).toLocaleDateString()],
    ["Warranty Period", `${item.warrantyPeriod} months`],
    ["Warranty Expiry", new Date(item.warrantyExpiryDate!).toLocaleDateString()],
    ["Last Inspection", item.lastInspectionDate ? new Date(item.lastInspectionDate).toLocaleDateString() : "Not inspected"],
    ["Condition", item.conditionStatus || "Good"],
  ];
  
  let currentY = startY + 15;
  pdf.setFontSize(10);
  
  details.forEach(([label, value]) => {
    pdf.setTextColor(100, 100, 100);
    pdf.text(label + ":", 20, currentY);
    pdf.setTextColor(33, 37, 41);
    pdf.text(value, 80, currentY);
    currentY += 8;
  });
  
  // Inspection Notes
  if (item.inspectionNotes) {
    currentY += 10;
    pdf.setFontSize(12);
    pdf.setTextColor(33, 37, 41);
    pdf.text("Inspection Notes", 20, currentY);
    
    currentY += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const notesLines = pdf.splitTextToSize(item.inspectionNotes, 170);
    pdf.text(notesLines, 20, currentY);
  }
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 20, 280);
  pdf.text("RailVision - AI-based QR Code Marking System", 20, 290);
  
  // Download the PDF
  pdf.save(`item-report-${item.id}.pdf`);
};
