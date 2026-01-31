import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../../api/axios";

const QR_VALID_SECONDS = 5;
const ROW_CHANGE_SECONDS = 15;

export default function LiveQR() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [qrData, setQrData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(QR_VALID_SECONDS);

  const expiryTimeRef = useRef(null);
  const tickRef = useRef(null);
  const rowTimerRef = useRef(null);

  /* Fetch QR and set exact expiry time */
  const fetchQR = async () => {
    try {
      const res = await api.get(`/qr/generate/${qrSessionId}`);
      setQrData(res.data);

      // exact expiry timestamp
      expiryTimeRef.current = Date.now() + QR_VALID_SECONDS * 1000;
      setSecondsLeft(QR_VALID_SECONDS);
    } catch (err) {
      console.error("QR fetch failed", err);
    }
  };

  /* Accurate countdown tick */
  useEffect(() => {
    fetchQR();

    tickRef.current = setInterval(() => {
      if (!expiryTimeRef.current) return;

      const diffMs = expiryTimeRef.current - Date.now();
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));

      setSecondsLeft(remaining);

      if (remaining === 0) {
        fetchQR();
      }
    }, 250); // high-resolution tick (still cheap)

    return () => clearInterval(tickRef.current);
  }, [qrSessionId]);

  /* Row change timer */
  useEffect(() => {
    rowTimerRef.current = setInterval(async () => {
      try {
        const res = await api.post(`/qr/next-row/${qrSessionId}`);
        if (!res.data.isActive) {
          navigate(`/teacher/qr/preview/${qrSessionId}`);
        }
      } catch (err) {
        console.error("Row update failed", err);
      }
    }, ROW_CHANGE_SECONDS * 1000);

    return () => clearInterval(rowTimerRef.current);
  }, [qrSessionId, navigate]);

  if (!qrData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500">Loading QR…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center w-full max-w-[420px]">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          QR Attendance
        </h2>

        <p className="text-sm text-gray-600 mb-1">
          Row: <span className="font-medium">{qrData.row}</span>
        </p>

        <p className="text-sm text-gray-600 mb-6">
          Valid for:{" "}
          <span className="font-semibold text-indigo-600">
            {secondsLeft}s
          </span>
        </p>

        <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200">
          <QRCode value={JSON.stringify(qrData)} size={256} />
        </div>

        <p className="mt-5 text-xs text-gray-400">
          QR refreshes exactly every {QR_VALID_SECONDS} seconds
        </p>
      </div>
    </div>
  );
}
