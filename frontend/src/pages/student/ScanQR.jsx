import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useEffect, useRef } from "react";
import api from "../../api/axios";

export default function QrScannerModal({ onClose }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    // Prevent double init in React StrictMode
    if (startedRef.current) return;
    startedRef.current = true;

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const stopScannerSafely = async () => {
      try {
        if (scanner.getState() === 2) {
          await scanner.stop();
        }
      } catch {}
      try {
        await scanner.clear();
      } catch {}
    };

    const startScanner = async () => {
      try {
        await scanner.start(
          {
            facingMode: { ideal: "environment" },
            focusMode: "continuous",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          {
            fps: 12,
            aspectRatio: 1.777778,
            disableFlip: false,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
          },
          async (decodedText) => {
            if (scannedRef.current) return;

            try {
              const data = JSON.parse(decodedText);

              if (!data.qrSessionId || !data.attendanceSlotId || !data.token) {
                return;
              }

              scannedRef.current = true;
              await api.post("/qr/submit", {
                qrSessionId: data.qrSessionId,
                attendanceSlotId: data.attendanceSlotId,
                token: data.token,
                expiresAt: data.expiresAt
              });

              alert("Attendance marked successfully");
              await stopScannerSafely();
              onClose();
            } catch (err) {
              const message = err.response?.data?.message || "Failed to mark attendance";

              if (message === "QR token invalid" || message === "QR expired") {
                scannedRef.current = false;
                return;
              }

              alert(message);
              scannedRef.current = false;
            }
          },
          () => {}
        );
      } catch {
        alert("Camera not accessible");
        await stopScannerSafely();
        onClose();
      }
    };

    startScanner();

    return () => {
      stopScannerSafely();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[95%] max-w-sm">
        <h3 className="text-lg font-semibold mb-4 text-center">Scan Attendance QR</h3>

        <div id="qr-reader" />

        <button
          onClick={async () => {
            try {
              if (scannerRef.current?.getState() === 2) {
                await scannerRef.current.stop();
              }
            } catch {}
            try {
              await scannerRef.current?.clear();
            } catch {}
            onClose();
          }}
          className="mt-4 w-full py-2 rounded-lg bg-red-500 text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
