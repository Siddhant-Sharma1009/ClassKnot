import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/teacherExperience.css";

export default function ManualAttendance() {
  const { slotId } = useParams();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [initialStatusMap, setInitialStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!slotId) {
      setLoading(false);
      return;
    }

    const fetchRecords = async () => {
      try {
        const res = await api.get(`/attendance/slot-records/${slotId}`);
        const data = res.data || [];
        setRecords(data);
        const map = {};
        data.forEach((r) => {
          map[r._id] = r.status;
        });
        setInitialStatusMap(map);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [slotId]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const matchesQuery =
        !q ||
        r.studentId?.name?.toLowerCase().includes(q) ||
        String(r.studentId?.collegeId || "").toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [records, query, statusFilter]);

  const presentCount = records.filter((r) => r.status === "P").length;
  const absentCount = records.length - presentCount;

  const changedRecords = useMemo(
    () => records.filter((r) => initialStatusMap[r._id] && initialStatusMap[r._id] !== r.status),
    [records, initialStatusMap]
  );

  const toggleStatus = (recordId) => {
    setRecords((prev) =>
      prev.map((r) =>
        r._id === recordId ? { ...r, status: r.status === "P" ? "A" : "P" } : r
      )
    );
  };

  const setAllVisibleStatus = (nextStatus) => {
    const visibleIds = new Set(filteredRecords.map((r) => r._id));
    setRecords((prev) =>
      prev.map((r) => (visibleIds.has(r._id) ? { ...r, status: nextStatus } : r))
    );
  };

  const resetChanges = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: initialStatusMap[r._id] || r.status })));
  };

  const saveAttendance = async () => {
    if (changedRecords.length === 0) return;

    try {
      setSaving(true);
      await api.post("/attendance/manual-update", {
        slotId,
        records: changedRecords.map((r) => ({
          recordId: r._id,
          status: r.status
        }))
      });

      const refreshedMap = {};
      records.forEach((r) => {
        refreshedMap[r._id] = r.status;
      });
      setInitialStatusMap(refreshedMap);

      alert(`Attendance saved (${changedRecords.length} changes)`);
      navigate(-1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const rows = filteredRecords.map((r) => ({
      collegeId: r.studentId?.collegeId || "",
      name: r.studentId?.name || "",
      status: r.status === "P" ? "Present" : "Absent"
    }));

    const header = ["College ID", "Name", "Status"];
    const csvBody = rows.map((row) =>
      [row.collegeId, row.name, row.status]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header.join(","), ...csvBody].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `manual-attendance-${slotId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!slotId) {
    return (
      <div className="teacher-shell">
        <div className="teacher-wrap" style={{ maxWidth: 760 }}>
          <div className="teacher-panel">
            <p className="text-red-600 font-semibold">Invalid attendance slot.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="teacher-shell">
        <div className="teacher-wrap" style={{ maxWidth: 760 }}>
          <div className="teacher-panel">
            <p className="teacher-sub">Loading attendance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-shell">
      <div className="teacher-wrap" style={{ maxWidth: 980 }}>
        <div className="teacher-panel">
          <h1 className="teacher-title">Manual Attendance</h1>
          <p className="teacher-sub">Search, filter, bulk-mark, then save only changed records.</p>

          <div className="teacher-grid" style={{ marginTop: 14 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or college ID"
              className="input-field"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="ALL">All</option>
              <option value="P">Present</option>
              <option value="A">Absent</option>
            </select>
          </div>

          <div className="teacher-actions" style={{ marginTop: 10 }}>
            <button onClick={() => setAllVisibleStatus("P")} className="btn-ghost">Mark Visible Present</button>
            <button onClick={() => setAllVisibleStatus("A")} className="btn-ghost">Mark Visible Absent</button>
            <button onClick={resetChanges} className="btn-ghost">Reset Changes</button>
            <button onClick={exportCsv} className="btn-ghost">Export CSV</button>
          </div>

          <div className="teacher-panel" style={{ marginTop: 12 }}>
            <p className="text-sm">
              Total: <strong>{records.length}</strong> | Present: <strong>{presentCount}</strong> | Absent: <strong>{absentCount}</strong> | Pending changes: <strong>{changedRecords.length}</strong>
            </p>
          </div>

          {records.length === 0 ? (
            <div className="teacher-panel" style={{ marginTop: 14 }}>
              <p className="teacher-sub">No students found.</p>
            </div>
          ) : (
            <div className="teacher-panel" style={{ marginTop: 14, padding: 0, overflowX: "auto" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="text-left p-3">College ID</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium">{r.studentId?.collegeId || "-"}</td>
                      <td className="p-3">{r.studentId?.name || "-"}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleStatus(r._id)}
                          className="btn-ghost"
                          style={{
                            background: r.status === "P" ? "#dcfce7" : "#fee2e2",
                            color: r.status === "P" ? "#166534" : "#b91c1c"
                          }}
                        >
                          {r.status === "P" ? "Present" : "Absent"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={3}>No students match current filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="teacher-actions">
            <button
              onClick={saveAttendance}
              disabled={records.length === 0 || changedRecords.length === 0 || saving}
              className="btn-primary"
            >
              {saving ? "Saving..." : `Save Attendance (${changedRecords.length})`}
            </button>
            <button onClick={() => navigate(-1)} className="btn-ghost">
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
