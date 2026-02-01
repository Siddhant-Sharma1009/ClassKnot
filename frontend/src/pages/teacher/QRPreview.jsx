import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function QRPreview() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Attendance state: { studentId: "present" | "absent" }
  const [attendanceMap, setAttendanceMap] = useState({});

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
      .then((res) => {
        setData(res.data);

        // Default everyone to PRESENT
        const initialAttendance = {};
        (res.data.submissions || []).forEach((s) => {
          if (s.studentId?._id) {
            initialAttendance[s.studentId._id] = "present";
          }
        });
        setAttendanceMap(initialAttendance);
      })
      .catch(() => alert("Failed to load preview"));
  }, [qrSessionId]);

  /* =============================
     SAVE → DASHBOARD
     ============================= */
  const save = async () => {
    try {
      setSaving(true);

      // OPTIONAL: send attendanceMap later if backend supports it
      await api.post(`/qr/save/${qrSessionId}`, {
        attendance: attendanceMap,
      });

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
     AI COUNTING
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

  useEffect(() => {
    if (!aiRunning) return;
    const interval = setInterval(fetchAiCount, 3000);
    return () => clearInterval(interval);
  }, [aiRunning]);

  /* =============================
     LOADING
     ============================= */
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500">Loading preview…</p>
      </div>
    );
  }

  /* =============================
     GROUP SUBMISSIONS ROW-WISE
     ============================= */
  const submissionsByRow = {};

  (data.submissions || []).forEach((s) => {
    const row = s.rowNumber;
    if (!submissionsByRow[row]) submissionsByRow[row] = [];
    submissionsByRow[row].push(s);
  });

  const sortedRows = Object.keys(submissionsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  /* =============================
     UI
     ============================= */
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 flex justify-center">
      <div className="w-full max-w-[650px] bg-white border rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          QR Attendance Preview
        </h2>

        {/* ROW-WISE ATTENDANCE */}
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Row-wise Attendance
        </h3>

        <div className="space-y-4">
          {sortedRows.map((row) => (
            <div key={row} className="border rounded-lg p-4 bg-slate-50">
              <p className="font-semibold text-gray-800 mb-3">
                Row {row}
              </p>

              <div className="space-y-2">
                {submissionsByRow[row].map((s) => {
                  const studentId = s.studentId?._id;
                  const collegeId = s.studentId?.collegeId;

                  return (
                    <div
                      key={studentId}
                      className="flex items-center justify-between bg-white border rounded-md px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {collegeId}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setAttendanceMap((prev) => ({
                              ...prev,
                              [studentId]: "present",
                            }))
                          }
                          className={`px-3 py-1 text-xs rounded-md font-semibold ${
                            attendanceMap[studentId] === "present"
                              ? "bg-green-600 text-white"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          Present
                        </button>

                        <button
                          onClick={() =>
                            setAttendanceMap((prev) => ({
                              ...prev,
                              [studentId]: "absent",
                            }))
                          }
                          className={`px-3 py-1 text-xs rounded-md font-semibold ${
                            attendanceMap[studentId] === "absent"
                              ? "bg-red-600 text-white"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI COUNTING */}
        <div className="mt-6 p-4 border rounded-lg bg-slate-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            🤖 AI Attendance (Real-Time)
          </h3>

          <input
            type="text"
            placeholder="Enter camera URL"
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />

          <button
            onClick={startAiCounting}
            disabled={aiLoading}
            className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white ${
              aiLoading
                ? "bg-gray-300"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
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

        {/* ACTIONS */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() =>
              navigate(`/teacher/attendance/${data.attendanceSlotId}`)
            }
            className="px-4 py-2 rounded-lg bg-slate-200 text-sm font-semibold"
          >
            ✏️ Edit Manually
          </button>

          <button
            onClick={retake}
            className="px-4 py-2 rounded-lg bg-yellow-100 text-sm font-semibold"
          >
            🔁 Retake QR
          </button>

          <button
            onClick={save}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
              saving
                ? "bg-gray-300"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            💾 {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
