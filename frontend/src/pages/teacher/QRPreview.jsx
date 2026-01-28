import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function QRPreview() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  // AI states
  const [aiUrl, setAiUrl] = useState("");
  const [aiCount, setAiCount] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  /* =============================
     FETCH PREVIEW DATA
     ============================= */
  useEffect(() => {
    api
      .get(`/qr/preview/${qrSessionId}`)
      .then((res) => setData(res.data))
      .catch(() => alert("Failed to load preview"));
  }, [qrSessionId]);

  /* =============================
     SAVE → DASHBOARD
     ============================= */
  const save = async () => {
    try {
      setSaving(true);
      await api.post(`/qr/save/${qrSessionId}`);
      alert("Attendance saved successfully");
      navigate("/teacher");
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* =============================
     RETAKE QR
     ============================= */
  const retake = async () => {
    try {
      const res = await api.post(`/qr/retake/${qrSessionId}`);
      navigate(`/teacher/qr/start/${res.data.attendanceSlotId}`);
    } catch {
      alert("Failed to retake QR");
    }
  };

  /* =============================
     START AI COUNTING
     ============================= */
  const startAiCounting = async () => {
    if (!aiUrl) {
      alert("Please enter camera URL");
      return;
    }

    try {
      setAiLoading(true);
      await api.post("/ai/start", { url: aiUrl });
      setAiRunning(true);
    } catch {
      alert("Failed to start AI counting");
    } finally {
      setAiLoading(false);
    }
  };

  /* =============================
     FETCH LIVE AI COUNT
     ============================= */
  const fetchAiCount = async () => {
  try {
    const res = await api.get("/api/ai/count");

    if (res.data.error) {
      alert(res.data.error);
      setAiRunning(false);
      setAiCount(null);
      return;
    }

    setAiCount(res.data.count);
  } catch {
    console.error("Failed to fetch AI count");
  }
};


  /* =============================
     AUTO POLLING (every 3 sec)
     ============================= */
  useEffect(() => {
    if (!aiRunning) return;

    const interval = setInterval(() => {
      fetchAiCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [aiRunning]);

  /* =============================
     LOADING STATE
     ============================= */
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500">Loading preview…</p>
      </div>
    );
  }

  /* =============================
     TOTAL SUBMISSIONS
     ============================= */
  const totalSubmissions = Object.values(data.rowStats || {}).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 flex justify-center">
      <div className="w-full max-w-[600px] bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          QR Attendance Preview
        </h2>

        {/* ROW-WISE DATA */}
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Row-wise Submissions
        </h3>

        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          {Object.entries(data.rowStats).map(([row, count]) => (
            <li key={row}>
              Row <span className="font-medium">{row}</span>:{" "}
              <span className="font-semibold text-indigo-600">{count}</span>{" "}
              submissions
            </li>
          ))}

          <li className="pt-2 mt-2 border-t font-semibold text-gray-900">
            Total submissions:{" "}
            <span className="text-indigo-700">{totalSubmissions}</span>
          </li>
        </ul>

        {/* AI COUNTING */}
        <div className="mt-6 p-4 border rounded-lg bg-slate-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            🤖 AI Attendance (Real-Time)
          </h3>

          <input
            type="text"
            placeholder="Enter camera URL (eg. http://192.168.1.110:8080/video)"
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
            className="
              w-full px-3 py-2
              border rounded-lg
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
          />

          <button
            onClick={startAiCounting}
            disabled={aiLoading}
            className={`
              mt-3 px-4 py-2
              rounded-lg
              text-sm font-semibold text-white
              transition
              ${
                aiLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }
            `}
          >
            {aiLoading ? "Starting AI..." : "Start AI Counting"}
          </button>

          {aiRunning && (
            <p className="mt-3 text-sm font-semibold text-green-700">
              🟢 AI is running
            </p>
          )}

          {aiCount !== null && (
            <p className="mt-2 text-sm font-semibold text-gray-800">
              AI Counted Students:
              <span className="ml-2 text-indigo-700">{aiCount}</span>
            </p>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() =>
              navigate(`/teacher/attendance/${data.attendanceSlotId}`)
            }
            className="
              px-4 py-2
              rounded-lg
              text-sm font-semibold
              bg-slate-200 text-gray-800
              transition hover:bg-slate-300
            "
          >
            ✏️ Edit Manually
          </button>

          <button
            onClick={retake}
            className="
              px-4 py-2
              rounded-lg
              text-sm font-semibold
              bg-yellow-100 text-yellow-800
              transition hover:bg-yellow-200
            "
          >
            🔁 Retake QR
          </button>

          <button
            onClick={save}
            disabled={saving}
            className={`
              px-4 py-2
              rounded-lg
              text-sm font-semibold text-white
              transition
              ${
                saving
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-lg"
              }
            `}
          >
            💾 {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
