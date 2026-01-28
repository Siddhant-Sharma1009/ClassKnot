import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../../api/axios";

export default function LiveQR() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [qrData, setQrData] = useState(null);
  const [seconds, setSeconds] = useState(5);

  /* Fetch QR every 5 seconds */
  useEffect(() => {
    const fetchQR = async () => {
      const res = await api.get(`/qr/generate/${qrSessionId}`);
      setQrData(res.data);
      setSeconds(5);
    };

    fetchQR();
    const qrInterval = setInterval(fetchQR, 3000);

    return () => clearInterval(qrInterval);
  }, [qrSessionId]);

  /* Countdown */
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* Row change every 20 sec */
  useEffect(() => {
    const rowTimer = setInterval(async () => {
      const res = await api.post(`/qr/next-row/${qrSessionId}`);

      if (!res.data.isActive) {
        navigate(`/teacher/qr/preview/${qrSessionId}`);
      }
    }, 15000);

    return () => clearInterval(rowTimer);
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
      <div className="
        bg-white
        border border-gray-200
        rounded-xl
        shadow-sm
        p-8
        text-center
        w-full max-w-[420px]
      ">
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
          QR refreshes automatically every 5 seconds
        </p>
      </div>
    </div>
  );
}
