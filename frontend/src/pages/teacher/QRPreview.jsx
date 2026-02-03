import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function QRPreview() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * attendanceMap
   * {
   *   studentId: "present" | "absent"
   * }
   */
  const [attendanceMap, setAttendanceMap] = useState({});

  // 🤖 AI STATES (UNCHANGED)
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
        const preview = res.data;
        setData(preview);

        // Default all students to PRESENT
        const initialAttendance = {};
        preview.submissions.forEach((s) => {
          if (s.studentId && s.studentId._id) {
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
     AI COUNTING (UNCHANGED)
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
  data.submissions.forEach((s) => {
    if (!submissionsByRow[s.rowNumber]) {
      submissionsByRow[s.rowNumber] = [];
    }
    submissionsByRow[s.rowNumber].push(s);
  });

  const sortedRows = Object.keys(submissionsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const totalSubmissions = data.submissions.length;

  /* =============================
     UI
     ============================= */
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 flex justify-center">
      <div className="w-full max-w-[650px] bg-white border rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          QR Attendance Preview
        </h2>

        {/* ROW-WISE COUNTS */}
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Row-wise Submissions (Count)
        </h3>

        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 mb-4">
          {sortedRows.map((row) => (
            <li key={row}>
              Row <b>{row}</b>:{" "}
              <span className="font-semibold text-indigo-600">
                {submissionsByRow[row].length}
              </span>
            </li>
          ))}
          <li className="pt-2 mt-2 border-t font-semibold text-gray-900">
            Total submissions:{" "}
            <span className="text-indigo-700">{totalSubmissions}</span>
          </li>
        </ul>

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
                  const studentObj = s.studentId;
                  const studentKey = studentObj?._id;
                  const collegeId =
                    studentObj && studentObj.collegeId
                      ? studentObj.collegeId
                      : "UNKNOWN";

                  const status = attendanceMap[studentKey];

                  return (
                    <div
                      key={studentKey}
                      className="flex items-center justify-between bg-white border rounded-md px-3 py-2"
                    >
                      <span className="text-sm font-semibold text-gray-800">
                        {collegeId}
                      </span>

                      <button
                        onClick={() =>
                          setAttendanceMap((prev) => ({
                            ...prev,
                            [studentKey]:
                              status === "present"
                                ? "absent"
                                : "present",
                          }))
                        }
                        className={`relative w-24 h-9 rounded-full transition-colors ${
                          status === "present"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform ${
                            status === "present"
                              ? "translate-x-14"
                              : "translate-x-0"
                          }`}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {status === "present"
                            ? "PRESENT"
                            : "ABSENT"}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-wrap gap-3">
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
