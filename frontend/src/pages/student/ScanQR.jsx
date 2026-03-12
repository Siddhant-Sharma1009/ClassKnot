import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useEffect, useRef } from "react";
import api from "../../api/axios";

const formatMediaError = (err) => {
  const name = err?.name || "";
  if (name === "NotAllowedError") return "Camera permission denied. Please allow access and try again.";
  if (name === "NotFoundError") return "No camera device found on this device.";
  if (name === "NotReadableError") return "Camera is already in use by another app.";
  if (name === "OverconstrainedError") return "Camera does not support the requested settings.";
  if (name === "SecurityError") return "Camera access requires HTTPS or localhost.";
  return "Camera not accessible.";
};

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
        const config = {
          fps: 12,
          aspectRatio: 1.777778,
          disableFlip: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        };

        const onDecode = async (decodedText) => {
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
        };

        let started = false;
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const preferred =
              cameras.find((cam) => /rear|back|environment/i.test(cam.label || "")) || cameras[0];
            await scanner.start(preferred.id, config, onDecode, () => {});
            started = true;
          }
        } catch {
          // Fall back to facingMode if camera listing fails.
        }

        if (!started) {
          await scanner.start({ facingMode: "environment" }, config, onDecode, () => {});
        }
      } catch (err) {
        alert(formatMediaError(err));
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
