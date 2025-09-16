import QRCode from "qrcode";
import JSZip from "jszip";
import QrScanner from "qr-scanner";
import { BrowserMultiFormatReader } from '@zxing/library';

export const generateQRCode = async (data: any): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

export const downloadQRCodesAsZip = async (items: any[]): Promise<void> => {
  const zip = new JSZip();

  for (const item of items) {
    try {
      // Use server API to ensure consistent QR format
      const response = await fetch(`/api/qr/${item.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch QR for item ${item.id}`);
      }
      
      const qrData = await response.json();
      const qrCodeDataURL = qrData.qrCode;

      // Convert data URL to blob
      const qrResponse = await fetch(qrCodeDataURL);
      const blob = await qrResponse.blob();
      
      zip.file(`${item.id}.png`, blob);
    } catch (error) {
      console.error(`Failed to generate QR for item ${item.id}:`, error);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  
  // Create download link
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `qr-codes-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Camera-based QR scanning
export const startCameraScanning = async (
  videoElement: HTMLVideoElement,
  onResult: (result: any) => void,
  onError: (error: string) => void
): Promise<QrScanner> => {
  try {
    const qrScanner = new QrScanner(
      videoElement,
      (result) => {
        try {
          // Try to parse the QR data as JSON (our format)
          const parsedData = JSON.parse(result.data);
          onResult(parsedData);
        } catch {
          // If not JSON, treat as plain text (might be item ID)
          onResult({ id: result.data });
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment', // Prefer rear camera for better UX
      }
    );

    await qrScanner.start();
    return qrScanner;
  } catch (error) {
    console.error("Camera scanning error:", error);
    onError("Failed to start camera scanning. Please check camera permissions.");
    throw error;
  }
};

// File-based QR scanning
export const scanQRCode = async (file: File): Promise<any> => {
  try {
    // Try qr-scanner first
    const result = await QrScanner.scanImage(file);
    try {
      return JSON.parse(result);
    } catch {
      return { id: result };
    }
  } catch (qrScannerError) {
    // Fallback to ZXing
    let imageUrl: string | null = null;
    try {
      const reader = new BrowserMultiFormatReader();
      imageUrl = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(imageUrl);
      try {
        return JSON.parse(result.getText());
      } catch {
        return { id: result.getText() };
      }
    } catch (zxingError) {
      console.error("QR scanning failed:", { qrScannerError, zxingError });
      throw new Error("Failed to read QR code from image");
    } finally {
      // Clean up object URL to prevent memory leak
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }
};

// Utility to check camera support
export const isCameraSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};
