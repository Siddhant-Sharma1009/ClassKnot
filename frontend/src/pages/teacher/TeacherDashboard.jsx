import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "../../styles/dashboardExperience.css";
import BackendStatusBadge from "../../components/BackendStatusBadge";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [teacher, setTeacher] = useState({ name: "", designation: "" });
  const [classes, setClasses] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (location.state?.success) {
      setSuccessMsg(location.state.success);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  }, [location.state]);

  useEffect(() => {
    api
      .get("/teacher/me")
      .then((res) => {
        setTeacher({
          name: res.data.name,
          designation: res.data.designation
        });
      })
      .catch(() => {
        setTeacher({ name: "Teacher", designation: "Faculty" });
      });
  }, []);

  useEffect(() => {
    api
      .get("/session/my-classes")
      .then((res) => setClasses(res.data))
      .catch(() => setClasses([]));
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const chartData = useMemo(() => {
    const bySemester = new Map();
    classes.forEach((cls) => {
      const key = `Sem ${cls.semester}`;
      bySemester.set(key, (bySemester.get(key) || 0) + 1);
    });
    return [...bySemester.entries()].map(([name, count]) => ({ name, count }));
  }, [classes]);

  return (
    <div className="dash-shell">
      <div className="dash-wrap">
        <div className="dash-panel">
          <div className="dash-head">
            <div>
              <h1 className="dash-title">Teacher Dashboard</h1>
              <p className="dash-sub">Manage classes and attendance sessions.</p>
              <div style={{ marginTop: 8 }}>
                <BackendStatusBadge />
              </div>
            </div>
            <div className="dash-actions">
              <button onClick={() => navigate("/teacher/create")} className="dash-btn-primary">Create Class</button>
              <button onClick={() => navigate("/teacher/profile")} className="dash-btn-ghost">Profile</button>
              <button onClick={logout} className="dash-btn-ghost">Logout</button>
            </div>
          </div>

          <div className="dash-card" style={{ marginTop: 16 }}>
            <h2 className="text-xl font-semibold">{teacher.name || "Loading..."}</h2>
            <p className="dash-sub" style={{ marginTop: 4 }}>{teacher.designation || ""}</p>
          </div>

          <div className="dash-kpi-grid">
            <div className="dash-card">
              <p className="dash-sub" style={{ marginTop: 0 }}>Total Classes</p>
              <p className="text-3xl font-bold text-slate-800" style={{ marginTop: 4 }}>{classes.length}</p>
            </div>
            <div className="dash-card">
              <p className="dash-sub" style={{ marginTop: 0 }}>Semesters Covered</p>
              <p className="text-3xl font-bold text-slate-800" style={{ marginTop: 4 }}>
                {new Set(classes.map((c) => c.semester)).size}
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="dash-card" style={{ marginTop: 12, borderColor: "#9ad9b7", background: "#f1fff7" }}>
              <p className="text-sm font-semibold text-green-700">{successMsg}</p>
            </div>
          )}

          <div className="dash-list">
            <h3 className="text-xl font-semibold">My Classes</h3>
            {chartData.length > 0 && (
              <div className="dash-chart-card" style={{ marginTop: 12, height: 240 }}>
                <p className="text-sm font-semibold text-slate-700">Classes Per Semester</p>
                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {classes.length === 0 ? (
              <div className="dash-card" style={{ marginTop: 10 }}>
                <p className="dash-sub">No classes created yet.</p>
              </div>
            ) : (
              <div className="dash-grid">
                {classes.map((cls) => (
                  <div
                    key={cls._id}
                    onClick={() => navigate(`/teacher/class/${cls._id}`)}
                    className="dash-card dash-click"
                  >
                    <div className="text-base font-bold text-blue-700">{cls.subjectCode}</div>
                    <div className="text-base font-medium text-slate-800" style={{ marginTop: 4 }}>{cls.subjectName}</div>
                    <p className="dash-sub" style={{ marginTop: 8 }}>{cls.branch} | Semester {cls.semester}</p>
                    <p className="text-xs text-slate-500" style={{ marginTop: 6 }}>
                      Section: {cls.section || "-"} | Group: {cls.group || "-"}
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
