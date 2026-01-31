import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef } from "react";
import api from "../../api/axios";

export default function QrScannerModal({ onClose }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    // 🚫 Prevent double init (React StrictMode)
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
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: { width: 300, height: 300 },
            disableFlip: true
          },
          async (decodedText) => {
            if (scannedRef.current) return;
            scannedRef.current = true;

            try {
              const data = JSON.parse(decodedText);

              // 🔐 STRICT QR VALIDATION
              if (
                !data.qrSessionId ||
                !data.attendanceSlotId ||
                data.row == null ||
                !data.token
              ) {
                alert("❌ Invalid or incomplete QR code");
                await stopScannerSafely();
                onClose();
                return;
              }

              await api.post("/qr/submit", {
                qrSessionId: data.qrSessionId,
                attendanceSlotId: data.attendanceSlotId,
                row: data.row,
                token: data.token,
                expiresAt: data.expiresAt
              });

              alert("✅ Attendance marked successfully");
              await stopScannerSafely();
              onClose();
            } catch (err) {
              alert(
                err.response?.data?.message ||
                "❌ Failed to mark attendance"
              );
              await stopScannerSafely();
              onClose();
            }
          },
          () => {} // ignore scan errors
        );
      } catch {
        alert("❌ Camera not accessible");
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
        <h3 className="text-lg font-semibold mb-4 text-center">
          Scan Attendance QR
        </h3>

        {/* ⚠️ MUST EXIST ONLY ONCE */}
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
