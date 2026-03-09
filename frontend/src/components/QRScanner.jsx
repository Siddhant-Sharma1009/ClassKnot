import { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) {
      return undefined;
    }

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        onScan(result.data);
      },
      {
        onDecodeError: () => {},
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5
      }
    );

    qrScanner.start();
    return () => qrScanner.destroy();
  }, [onScan]);

  return (
    <div className="qr-scanner-container">
      <video ref={videoRef} style={{ width: "100%", maxWidth: "500px" }}></video>
    </div>
  );
}
