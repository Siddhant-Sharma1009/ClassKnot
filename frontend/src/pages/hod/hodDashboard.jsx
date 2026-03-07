import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "../../styles/dashboardExperience.css";
import BackendStatusBadge from "../../components/BackendStatusBadge";

export default function HodDashboard() {
  const [hod, setHod] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get("/hod/me"), api.get("/hod/subjects")])
      .then(([profileRes, subjectsRes]) => {
        setHod(profileRes.data);
        setSubjects(subjectsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const semesters = [
    "ALL",
    ...Array.from(new Set(subjects.map((s) => s.semester).filter(Boolean))).sort((a, b) => a - b)
  ];

  const filteredSubjects =
    selectedSemester === "ALL"
      ? subjects
      : subjects.filter((s) => s.semester === Number(selectedSemester));

  const semesterChartData = Object.entries(
    subjects.reduce((acc, s) => {
      const key = `Sem ${s.semester ?? "NA"}`;
      if (!acc[key]) acc[key] = { total: 0, sum: 0 };
      acc[key].total += 1;
      acc[key].sum += Number(s.attendancePercent || 0);
      return acc;
    }, {})
  ).map(([name, v]) => ({
    name,
    avgAttendance: Number((v.sum / v.total).toFixed(1))
  }));

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="dash-shell">
        <div className="dash-wrap"><div className="dash-panel"><p className="dash-sub">Loading HOD dashboard...</p></div></div>
      </div>
    );
  }

  return (
    <div className="dash-shell">
      <div className="dash-wrap">
        <div className="dash-panel">
          <div className="dash-head">
            <div>
              <h1 className="dash-title">HOD Dashboard</h1>
              <p className="dash-sub">Review subjects and attendance summaries.</p>
              <div style={{ marginTop: 8 }}>
                <BackendStatusBadge />
              </div>
            </div>
            <div className="dash-actions">
              <button onClick={() => navigate("/hod/profile")} className="dash-btn-ghost">Profile</button>
              <button onClick={logout} className="dash-btn-ghost">Logout</button>
            </div>
          </div>

          <div className="dash-card" style={{ marginTop: 16 }}>
            <h2 className="text-xl font-semibold">{hod?.name || "Head of Department"}</h2>
            <p className="dash-sub" style={{ marginTop: 4 }}>College ID: {hod?.collegeId || "-"}</p>
          </div>

          <div className="dash-kpi-grid">
            <div className="dash-card">
              <p className="dash-sub" style={{ marginTop: 0 }}>Subjects</p>
              <p className="text-3xl font-bold text-slate-800" style={{ marginTop: 4 }}>{subjects.length}</p>
            </div>
            <div className="dash-card">
              <p className="dash-sub" style={{ marginTop: 0 }}>Semesters</p>
              <p className="text-3xl font-bold text-slate-800" style={{ marginTop: 4 }}>
                {new Set(subjects.map((s) => s.semester)).size}
              </p>
            </div>
          </div>

          <div className="dash-list">
            <div className="dash-head">
              <h3 className="text-xl font-semibold">Subjects & Teachers</h3>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="dash-btn-ghost"
                style={{ padding: "10px 12px" }}
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem === "ALL" ? "All Semesters" : `Semester ${sem}`}
                  </option>
                ))}
              </select>
            </div>

            {semesterChartData.length > 0 && (
              <div className="dash-chart-card" style={{ marginTop: 12, height: 250 }}>
                <p className="text-sm font-semibold text-slate-700">Average Attendance By Semester</p>
                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={semesterChartData}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgAttendance" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {filteredSubjects.length === 0 ? (
              <div className="dash-card" style={{ marginTop: 12 }}>
                <p className="dash-sub">No subjects found for selected semester.</p>
              </div>
            ) : (
              <div className="dash-grid">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject._id}
                    onClick={() => navigate(`/hod/subject/${subject._id}`)}
                    className="dash-card dash-click"
                  >
                    <h3 className="text-base font-semibold text-slate-800">{subject.name}</h3>
                    <p className="dash-sub" style={{ marginTop: 6 }}>Code: {subject.code}</p>
                    <p className="dash-sub" style={{ marginTop: 2 }}>Semester: {subject.semester ?? "N/A"}</p>
                    <p className="dash-sub" style={{ marginTop: 2 }}>Classes: {subject.classCount ?? 0}</p>
                    <p className="dash-sub" style={{ marginTop: 2 }}>Slots: {subject.slotCount ?? 0}</p>
                    <p className="text-sm text-slate-700" style={{ marginTop: 10 }}>
                      Teacher: {subject.teacherName || "Not Assigned"}
                    </p>
                    <p className="text-sm text-slate-700" style={{ marginTop: 4 }}>
                      Avg Attendance: {subject.attendancePercent ?? 0}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
