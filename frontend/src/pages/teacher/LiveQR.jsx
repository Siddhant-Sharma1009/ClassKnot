import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../../api/axios";
import "../../styles/qrExperience.css";

export default function LiveQR() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [qrData, setQrData] = useState(null);
  const [ending, setEnding] = useState(false);
  const [qrSize, setQrSize] = useState(420);

  useEffect(() => {
    const setResponsiveSize = () => {
      const minEdge = Math.min(window.innerWidth, window.innerHeight);
      const next = Math.max(300, Math.min(900, Math.floor(minEdge * 0.72)));
      setQrSize(next);
    };

    setResponsiveSize();
    window.addEventListener("resize", setResponsiveSize);
    return () => window.removeEventListener("resize", setResponsiveSize);
  }, []);

  useEffect(() => {
    const fetchQR = async () => {
      const res = await api.get(`/qr/generate/${qrSessionId}`);
      setQrData(res.data);
    };

    fetchQR();
    const qrInterval = setInterval(fetchQR, 5000);

    return () => clearInterval(qrInterval);
  }, [qrSessionId]);

  const endSession = async () => {
    try {
      setEnding(true);
      await api.post(`/qr/end/${qrSessionId}`);
      navigate(`/teacher/qr/preview/${qrSessionId}`);
    } catch {
      alert("Failed to end QR session");
    } finally {
      setEnding(false);
    }
  };

  if (!qrData) {
    return (
      <div className="qr-screen">
        <p className="text-gray-500">Loading QR...</p>
      </div>
    );
  }

  return (
    <div className="qr-screen">
      <div className="qr-card">
        <h1 className="qr-title">Live Attendance QR</h1>
        <p className="qr-sub">Keep this visible on the smart board for students to scan.</p>

        <div className="qr-grid">
          <div className="qr-panel">
            <div className="qr-frame">
              <QRCode value={JSON.stringify(qrData)} size={qrSize} level="H" />
            </div>
            <p className="qr-sub" style={{ textAlign: "center", marginBottom: 0 }}>
              QR expires in 10s and auto-refreshes every 5s.
            </p>
          </div>

          <div className="qr-panel">
            <div className="action-stack">
              <button onClick={endSession} disabled={ending} className="btn-main">
                {ending ? "Ending Session..." : "Finish Session"}
              </button>
              <button onClick={() => navigate("/teacher")} className="btn-alt">
                Go To Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
