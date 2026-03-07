import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/qrExperience.css";

export default function QRPreview() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  const [aiUrl, setAiUrl] = useState("");
  const [aiCount, setAiCount] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api
      .get(`/qr/preview/${qrSessionId}`)
      .then((res) => setData(res.data))
      .catch(() => alert("Failed to load preview"));
  }, [qrSessionId]);

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

  const retake = async () => {
    try {
      const res = await api.post(`/qr/retake/${qrSessionId}`);
      navigate(`/teacher/qr/start/${res.data.attendanceSlotId}`);
    } catch {
      alert("Failed to retake QR");
    }
  };

  const startAiCounting = async () => {
    if (!aiUrl) {
      alert("Please enter camera URL");
      return;
    }

    try {
      setAiLoading(true);
      await api.post("/ai/start", { url: aiUrl, profile: "front_center" });
      setAiRunning(true);
    } catch {
      alert("Failed to start AI counting");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchAiCount = async () => {
    try {
      const res = await api.get("/ai/count");

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

  if (!data) {
    return (
      <div className="qr-screen">
        <p className="text-gray-500">Loading preview...</p>
      </div>
    );
  }

  const totalSubmissions = data.totalSubmissions || 0;

  return (
    <div className="qr-screen">
      <div className="qr-card">
        <h1 className="qr-title">QR Attendance Preview</h1>
        <p className="qr-sub">Review responses, then confirm and save attendance.</p>

        <div className="qr-grid">
          <div className="qr-panel">
            <h3 className="text-xl font-semibold">Session Summary</h3>
            <p className="qr-sub" style={{ marginTop: 8 }}>
              Total submissions: <strong>{totalSubmissions}</strong>
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-2">Submitted Student IDs</h4>
            <ul className="preview-list">
              {(data.submissions || []).map((s, idx) => (
                <li key={s._id || idx}>{s.studentId?.collegeId || "N/A"}</li>
              ))}
            </ul>
          </div>

          <div className="qr-panel">
            <h3 className="text-xl font-semibold">AI Attendance</h3>
            <p className="qr-sub">Optional real-time camera estimate.</p>

            <input
              type="text"
              placeholder="Enter camera URL"
              value={aiUrl}
              onChange={(e) => setAiUrl(e.target.value)}
              className="w-full px-3 py-3 border rounded-lg text-sm mt-3"
            />

            <button
              onClick={startAiCounting}
              disabled={aiLoading}
              className="btn-main"
              style={{ marginTop: 12 }}
            >
              {aiLoading ? "Starting AI..." : "Start AI Counting"}
            </button>

            {aiRunning && <p className="qr-sub">AI service is running.</p>}
            {aiCount !== null && (
              <p className="qr-sub">
                AI Counted Students: <strong>{aiCount}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="action-stack" style={{ marginTop: 20 }}>
          <button
            onClick={() => navigate(`/teacher/attendance/${data.attendanceSlotId}`)}
            className="btn-alt"
          >
            Edit Manually
          </button>
          <button onClick={retake} className="btn-alt">
            Retake QR
          </button>
          <button onClick={save} disabled={saving} className="btn-main">
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
