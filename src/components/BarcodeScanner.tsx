import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scannerId = "barcode-scanner-container";
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 150 } },
        (decodedText) => {
          scanner.stop().then(() => onScan(decodedText)).catch(console.error);
        },
        undefined
      )
      .catch((err) => {
        setError("Kamera-Zugriff nicht möglich. Bitte erlaube den Zugriff.");
        console.error(err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Barcode scannen</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div
          ref={containerRef}
          id="barcode-scanner-container"
          className="w-full max-w-sm rounded-2xl overflow-hidden"
        />
        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Halte den Barcode vor die Kamera
        </p>
      </div>
    </div>
  );
}
