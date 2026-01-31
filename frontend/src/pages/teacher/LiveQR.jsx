import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../../api/axios";

const QR_DURATION = 6;      // seconds
const ROW_DURATION = 15;   // seconds

export default function LiveQR() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [qrData, setQrData] = useState(null);
  const [seconds, setSeconds] = useState(QR_DURATION);

  const countdownRef = useRef(null);
  const rowRef = useRef(null);

  /* Fetch QR */
  const fetchQR = async () => {
    try {
      const res = await api.get(`/qr/generate/${qrSessionId}`);
      setQrData(res.data);
      setSeconds(QR_DURATION);
    } catch (err) {
      console.error("QR fetch failed", err);
    }
  };

  /* QR refresh + countdown (LOCKED TOGETHER) */
  useEffect(() => {
    fetchQR();

    // clear old timer if any
    clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev === 1) {
          fetchQR();          // refresh QR exactly at 0
          return QR_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [qrSessionId]);

  /* Row change */
  useEffect(() => {
    rowRef.current = setInterval(async () => {
      try {
        const res = await api.post(`/qr/next-row/${qrSessionId}`);
        if (!res.data.isActive) {
          navigate(`/teacher/qr/preview/${qrSessionId}`);
        }
      } catch (err) {
        console.error("Row update failed", err);
      }
    }, ROW_DURATION * 1000);

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
            {seconds}s
          </span>
        </p>

        <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200">
          <QRCode value={JSON.stringify(qrData)} size={256} />
        </div>

        <p className="mt-5 text-xs text-gray-400">
          QR refreshes every {QR_DURATION} seconds
        </p>
      </div>
    </div>
  );
}
