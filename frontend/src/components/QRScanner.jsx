import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          onScan(result.data);
        },
        {
          onDecodeError: (error) => {
            console.log("Decode error:", error);
          },
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5
        }
      );

      qrScanner.start();
      setScanner(qrScanner);

      return () => qrScanner.destroy();
    }
  }, [onScan]);

  return (
    <div className="qr-scanner-container">
      <video ref={videoRef} style={{ width: "100%", maxWidth: "500px" }}></video>
    </div>
  );
}
