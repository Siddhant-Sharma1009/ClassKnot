import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../../api/axios";
import "../../styles/teacherExperience.css";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await api.get(`/attendance/slots/${classId}`);
        setSlots(res.data || []);
      } catch {
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [classId]);

  const createSlot = async () => {
    if (creating) return null;

    try {
      setCreating(true);
      const res = await api.post(`/attendance/slot/${classId}`);
      return res.data?._id || null;
    } catch {
      alert("Failed to start attendance");
      return null;
    } finally {
      setCreating(false);
    }
  };

  const startManual = async () => {
    const slotId = await createSlot();
    if (slotId) navigate(`/teacher/attendance/${slotId}`);
  };

  const startQR = async () => {
    const slotId = await createSlot();
    if (slotId) navigate(`/teacher/qr/start/${slotId}`);
  };

  const filteredSlots = useMemo(() => {
    if (filter === "ALL") return slots;
    if (filter === "LOW") return slots.filter((s) => (s.stats?.percentage || 0) < 75);
    if (filter === "GOOD") return slots.filter((s) => (s.stats?.percentage || 0) >= 75);
    return slots;
  }, [slots, filter]);

  const averagePercentage = useMemo(() => {
    if (slots.length === 0) return 0;
    const sum = slots.reduce((acc, s) => acc + (s.stats?.percentage || 0), 0);
    return Number((sum / slots.length).toFixed(2));
  }, [slots]);

  const trendData = useMemo(
    () =>
      [...slots]
        .reverse()
        .map((slot) => ({
          date: formatDate(slot.date),
          percentage: slot.stats?.percentage || 0
        })),
    [slots]
  );

  const downloadCsv = (fileName, rows) => {
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAllHistoryCsv = () => {
    const rows = [["Date", "Start Time", "Attendance %", "Present", "Absent", "Total", "Manual", "QR"]];

    filteredSlots.forEach((slot) => {
      rows.push([
        formatDate(slot.date),
        formatTime(slot.startTime),
        slot.stats?.percentage ?? 0,
        slot.stats?.presentCount ?? 0,
        slot.stats?.absentCount ?? 0,
        slot.stats?.totalCount ?? 0,
        slot.stats?.manualCount ?? 0,
        slot.stats?.qrCount ?? 0
      ]);
    });

    downloadCsv(`attendance-history-${classId}.csv`, rows);
  };

  const exportSlotCsv = (slot) => {
    const rows = [
      ["Field", "Value"],
      ["Slot ID", slot._id],
      ["Date", formatDate(slot.date)],
      ["Start Time", formatTime(slot.startTime)],
      ["Attendance %", slot.stats?.percentage ?? 0],
      ["Present", slot.stats?.presentCount ?? 0],
      ["Absent", slot.stats?.absentCount ?? 0],
      ["Total", slot.stats?.totalCount ?? 0],
      ["Manual Marked", slot.stats?.manualCount ?? 0],
      ["QR Marked", slot.stats?.qrCount ?? 0]
    ];

    downloadCsv(`attendance-slot-${slot._id}.csv`, rows);
  };

  return (
    <div className="teacher-shell">
      <div className="teacher-wrap" style={{ maxWidth: 980 }}>
        <div className="teacher-panel">
          <h1 className="teacher-title">Class Attendance</h1>
          <p className="teacher-sub">Start attendance and review detailed history for this class.</p>

          <div className="teacher-actions">
            <button onClick={startManual} disabled={creating} className="btn-primary">
              Manual Attendance
            </button>
            <button onClick={startQR} disabled={creating} className="btn-primary">
              QR Attendance
            </button>
            <button onClick={() => navigate(`/teacher/attendance-summary/${classId}`)} className="btn-ghost">
              Attendance Summary
            </button>
          </div>

          <div className="teacher-panel" style={{ marginTop: 14 }}>
            <p className="text-sm">
              Sessions: <strong>{slots.length}</strong> | Average attendance: <strong>{averagePercentage}%</strong>
            </p>
          </div>

          {trendData.length > 0 && (
            <div className="teacher-chart-card" style={{ marginTop: 14, height: 260 }}>
              <p className="text-sm font-semibold text-slate-700">Attendance Trend By Session</p>
              <ResponsiveContainer width="100%" height="88%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" hide={trendData.length > 8} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="teacher-actions" style={{ marginTop: 10 }}>
            <button onClick={() => setFilter("ALL")} className="btn-ghost">All Sessions</button>
            <button onClick={() => setFilter("GOOD")} className="btn-ghost">Good (&gt;=75%)</button>
            <button onClick={() => setFilter("LOW")} className="btn-ghost">Low (&lt;75%)</button>
            <button onClick={exportAllHistoryCsv} className="btn-ghost">Export History CSV</button>
          </div>

          <h3 className="text-xl font-semibold" style={{ marginTop: 20 }}>Attendance History</h3>

          {loading && <p className="teacher-sub">Loading...</p>}

          {!loading && slots.length === 0 && (
            <div className="teacher-panel" style={{ marginTop: 12 }}>
              <p className="teacher-sub">No attendance taken yet.</p>
            </div>
          )}

          {!loading && slots.length > 0 && (
            <div className="teacher-grid" style={{ marginTop: 12 }}>
              {filteredSlots.map((slot) => {
                const pct = slot.stats?.percentage || 0;
                const badgeColor = pct >= 75 ? "#166534" : "#b91c1c";
                const badgeBg = pct >= 75 ? "#dcfce7" : "#fee2e2";

                return (
                  <div key={slot._id} className="teacher-card">
                    <p className="text-sm text-slate-700 font-semibold">{formatDate(slot.date)}</p>
                    <p className="teacher-sub" style={{ marginTop: 4 }}>
                      Start: {formatTime(slot.startTime)}
                    </p>

                    <div style={{ marginTop: 10 }}>
                      <span
                        className="text-xs font-semibold"
                        style={{ background: badgeBg, color: badgeColor, padding: "4px 8px", borderRadius: 999 }}
                      >
                        {pct}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-600" style={{ marginTop: 8 }}>
                      Present: {slot.stats?.presentCount || 0} | Absent: {slot.stats?.absentCount || 0} | Total: {slot.stats?.totalCount || 0}
                    </p>

                    <p className="text-xs text-slate-500" style={{ marginTop: 4 }}>
                      Manual: {slot.stats?.manualCount || 0} | QR: {slot.stats?.qrCount || 0}
                    </p>

                    <div className="teacher-actions" style={{ marginTop: 10 }}>
                      <button onClick={() => navigate(`/teacher/attendance/${slot._id}`)} className="btn-ghost">
                        Open Slot
                      </button>
                      <button onClick={() => exportSlotCsv(slot)} className="btn-ghost">
                        Export Slot CSV
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
