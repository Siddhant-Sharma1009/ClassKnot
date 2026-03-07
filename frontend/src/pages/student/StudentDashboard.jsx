import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import QrScannerModal from "./ScanQR";
import "../../styles/dashboardExperience.css";
import BackendStatusBadge from "../../components/BackendStatusBadge";

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectAttendance, setSubjectAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showOverall, setShowOverall] = useState(false);
  const [overallData, setOverallData] = useState([]);
  const [overallLoading, setOverallLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.get("/student/me");
        setProfile(p.data);

        const s = await api.get("/student/subjects");
        setSubjects(s.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadSubjectAttendance = async (subjectCode, subjectName) => {
    try {
      const res = await api.get(`/student/subject/${subjectCode}/attendance`);
      setSubjectAttendance(res.data);
      setSelectedSubject(subjectName);
      setShowOverall(false);
    } catch {
      alert("Failed to load attendance data");
    }
  };

  const loadOverallAttendance = async () => {
    if (subjects.length === 0) {
      setOverallData([]);
      setShowOverall(true);
      setSubjectAttendance(null);
      setSelectedSubject(null);
      return;
    }

    try {
      setOverallLoading(true);
      const results = await Promise.all(
        subjects.map(async (sub) => {
          const res = await api.get(`/student/subject/${sub.subjectCode}/attendance`);
          return {
          code: sub.subjectCode,
          name: sub.subjectName,
          percentage: res.data.summary.percentage
          };
        })
      );
      setOverallData(results);
      setShowOverall(true);
      setSubjectAttendance(null);
      setSelectedSubject(null);
    } catch {
      alert("Failed to load overall attendance");
    } finally {
      setOverallLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="dash-shell">
        <div className="dash-wrap"><div className="dash-panel"><p className="dash-sub">Loading...</p></div></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dash-shell">
        <div className="dash-wrap"><div className="dash-panel"><p className="text-red-600">Student profile not found.</p></div></div>
      </div>
    );
  }

  return (
    <div className="dash-shell">
      <div className="dash-wrap">
        <div className="dash-panel">
          <div className="dash-head">
            <div>
              <h1 className="dash-title">Student Dashboard</h1>
              <p className="dash-sub">Track subjects and attendance quickly.</p>
              <div style={{ marginTop: 8 }}>
                <BackendStatusBadge />
              </div>
            </div>
            <div className="dash-actions">
              <button onClick={() => setShowScanner(true)} className="dash-btn-primary">Scan QR</button>
              <button onClick={() => navigate("/student/profile")} className="dash-btn-ghost">Profile</button>
              <button onClick={logout} className="dash-btn-ghost">Logout</button>
            </div>
          </div>

          <div className="dash-card" style={{ marginTop: 16 }}>
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="dash-sub" style={{ marginTop: 4 }}>
              {profile.branch} | Semester {profile.semester}
              {profile.section ? ` | Section ${profile.section}` : ""}
              {profile.group ? ` | Group ${profile.group}` : ""}
            </p>
          </div>

          <div className="dash-actions" style={{ marginTop: 12 }}>
            <button onClick={loadOverallAttendance} className="dash-btn-primary" disabled={overallLoading}>
              {overallLoading ? "Loading Overall..." : "Overall Attendance %"}
            </button>
          </div>

          {showOverall && (
            <div className="dash-card" style={{ marginTop: 14 }}>
              <h3 className="text-lg font-semibold">Overall Attendance</h3>
              {overallData.length > 0 && (
                <div className="dash-grid" style={{ marginTop: 12 }}>
                  <div className="dash-chart-card" style={{ height: 260 }}>
                    <p className="text-sm font-semibold text-slate-700">Subject-wise Percentage</p>
                    <ResponsiveContainer width="100%" height="88%">
                      <BarChart data={overallData}>
                        <XAxis dataKey="code" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="percentage" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="dash-chart-card" style={{ height: 260 }}>
                    <p className="text-sm font-semibold text-slate-700">Healthy vs Risk</p>
                    <ResponsiveContainer width="100%" height="88%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: ">= 75%", value: overallData.filter((s) => s.percentage >= 75).length },
                            { name: "< 75%", value: overallData.filter((s) => s.percentage < 75).length }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={76}
                          innerRadius={44}
                          label
                        >
                          <Cell fill="#16a34a" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              <div className="dash-grid">
                {overallData.map((sub) => (
                  <div key={sub.code} className="dash-card">
                    <div className="text-sm font-semibold">{sub.code} - {sub.name}</div>
                    <div className="text-sm" style={{ marginTop: 6 }}>{sub.percentage}%</div>
                    <div className="dash-progress" style={{ marginTop: 8 }}>
                      <span style={{ width: `${sub.percentage}%`, background: sub.percentage >= 75 ? "#16a34a" : "#ef4444" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dash-list">
            <h3 className="text-xl font-semibold">My Subjects</h3>
            <div className="dash-grid">
              {subjects.map((sub) => (
                <div
                  key={sub.subjectCode}
                  onClick={() => loadSubjectAttendance(sub.subjectCode, sub.subjectName)}
                  className="dash-card dash-click"
                  style={selectedSubject === sub.subjectName ? { borderColor: "#7f9dff", background: "#f3f6ff" } : {}}
                >
                  <div className="text-base font-bold text-blue-700">{sub.subjectCode}</div>
                  <p className="dash-sub" style={{ marginTop: 6 }}>{sub.subjectName}</p>
                </div>
              ))}
            </div>
          </div>

          {subjectAttendance && (
            <div className="dash-card" style={{ marginTop: 14 }}>
              <h3 className="text-lg font-semibold">Attendance - {selectedSubject}</h3>
              <div className="dash-chart-card" style={{ marginTop: 12, height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Present", value: subjectAttendance.summary.present },
                        { name: "Absent", value: subjectAttendance.summary.absent }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={72}
                      innerRadius={38}
                      label
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-grid">
                <Summary label="Total" value={subjectAttendance.summary.total} />
                <Summary label="Present" value={subjectAttendance.summary.present} />
                <Summary label="Absent" value={subjectAttendance.summary.absent} />
                <Summary label="Percent" value={`${subjectAttendance.summary.percentage}%`} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showScanner && <QrScannerModal onClose={() => setShowScanner(false)} />}
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="dash-card">
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
