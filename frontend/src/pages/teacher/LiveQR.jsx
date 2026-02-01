import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../../api/axios";

const ROW_CHANGE_SECONDS = 15;

export default function LiveQR() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [qrData, setQrData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const expiryRef = useRef(0);
  const countdownRef = useRef(null);
  const rowRef = useRef(null);

  /* Fetch QR ONCE per cycle */
  const fetchQR = async () => {
    const res = await api.get(`/qr/generate/${qrSessionId}`);
    setQrData(res.data);
    expiryRef.current = res.data.expiresAt;

    // initialize countdown immediately (smooth start)
    const diff = expiryRef.current - Date.now();
    setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
  };

  /* Smooth 1-second countdown */
  useEffect(() => {
    fetchQR();

    countdownRef.current = setInterval(() => {
      const diff = expiryRef.current - Date.now();
      const remaining = Math.max(0, Math.floor(diff / 1000));

      setSecondsLeft(prev => {
        // avoid unnecessary re-renders
        return prev !== remaining ? remaining : prev;
      });

      if (remaining === 0) {
        fetchQR(); // QR changes calmly AFTER countdown ends
      }
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [qrSessionId]);

  /* Row change (independent, slow, stable) */
  useEffect(() => {
    rowRef.current = setInterval(async () => {
      const res = await api.post(`/qr/next-row/${qrSessionId}`);
      if (!res.data.isActive) {
        navigate(`/teacher/qr/preview/${qrSessionId}`);
      }
    }, ROW_CHANGE_SECONDS * 1000);

    return () => clearInterval(rowRef.current);
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
          Smooth countdown · Server-controlled expiry
        </p>
      </div>
    </div>
  );
}
