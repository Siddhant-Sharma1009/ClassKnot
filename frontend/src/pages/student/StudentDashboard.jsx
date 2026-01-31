import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import QrScannerModal from "./ScanQR";

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectAttendance, setSubjectAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // ✅ overall attendance
  const [showOverall, setShowOverall] = useState(false);
  const [overallData, setOverallData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.get("/student/me");
        setProfile(p.data);

        const s = await api.get("/student/subjects");
        setSubjects(s.data);
      } catch (err) {
        console.error("Student dashboard load failed", err);
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
    try {
      const data = [];
      for (const sub of subjects) {
        const res = await api.get(
          `/student/subject/${sub.subjectCode}/attendance`
        );
        data.push({
          code: sub.subjectCode,
          name: sub.subjectName,
          percentage: res.data.summary.percentage
        });
      }
      setOverallData(data);
      setShowOverall(true);
      setSubjectAttendance(null);
      setSelectedSubject(null);
    } catch {
      alert("Failed to load overall attendance");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500 text-lg">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-red-600 text-lg">Student profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg p-5">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-3">
          <h1 className="text-2xl font-semibold">📚 Student Dashboard</h1>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/student/profile")}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-md text-sm font-medium hover:bg-white/30"
            >
              👤 Profile
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500/80 rounded-md text-sm font-medium hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-[1200px] mx-auto w-full px-5 py-8 flex-1 space-y-8">

        {/* ================= PROFILE ================= */}
        <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-indigo-500 text-white flex items-center justify-center text-4xl font-bold shadow-md">
              {profile.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                {profile.name}
              </h2>

              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-slate-100 border rounded-full text-sm text-gray-600">
                  📍 {profile.branch}
                </span>
                <span className="px-4 py-2 bg-slate-100 border rounded-full text-sm text-gray-600">
                  📖 Semester {profile.semester}
                </span>
                {profile.section && (
                  <span className="px-4 py-2 bg-slate-100 border rounded-full text-sm text-gray-600">
                    👥 Section {profile.section}
                  </span>
                )}
                {profile.group && (
                  <span className="px-4 py-2 bg-slate-100 border rounded-full text-sm text-gray-600">
                    🎯 Group {profile.group}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ================= BUTTONS ================= */}
          <div className="flex flex-wrap gap-4 pt-6 border-t">
            <button
              onClick={() => setShowScanner(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              📷 Scan QR
            </button>

            <button
              onClick={loadOverallAttendance}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              📊 Overall Attendance %
            </button>
          </div>
        </section>

        {/* ================= OVERALL ATTENDANCE ================= */}
        {showOverall && (
          <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              📊 Overall Attendance Percentage
            </h3>

            <div className="space-y-4">
              {overallData.map(sub => (
                <div key={sub.code}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">
                      {sub.code} – {sub.name}
                    </span>
                    <span className="font-semibold">{sub.percentage}%</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        sub.percentage >= 75
                          ? "bg-green-600"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= SUBJECTS ================= */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            📚 My Subjects
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map(sub => (
              <div
                key={sub.subjectCode}
                onClick={() =>
                  loadSubjectAttendance(sub.subjectCode, sub.subjectName)
                }
                className={`cursor-pointer p-6 rounded-xl border-2 transition ${
                  selectedSubject === sub.subjectName
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : "border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                <div className="text-lg font-bold text-indigo-500 mb-2">
                  {sub.subjectCode}
                </div>
                <p className="text-gray-600 font-medium mb-4">
                  {sub.subjectName}
                </p>
                <div className="text-2xl text-indigo-400/60">→</div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= ATTENDANCE DETAILS ================= */}
        {subjectAttendance && (
          <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              📊 Attendance – {selectedSubject}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <Summary icon="📊" label="Total Classes" value={subjectAttendance.summary.total} />
              <Summary icon="✓" label="Present" value={subjectAttendance.summary.present} />
              <Summary icon="✗" label="Absent" value={subjectAttendance.summary.absent} />
              <Summary icon="%" label="Attendance %" value={`${subjectAttendance.summary.percentage}%`} />
            </div>
          </section>
        )}
      </main>

      {/* ================= QR MODAL ================= */}
      {showScanner && (
        <QrScannerModal onClose={() => setShowScanner(false)} />
      )}

      <footer className="border-t text-center py-5 text-sm text-gray-400">
        © 2026 ClassKnot • Attendance Management System
      </footer>
    </div>
  );
}

/* ================= HELPERS ================= */
function Summary({ icon, label, value }) {
  return (
    <div className="p-5 bg-slate-50 rounded-lg text-center border-l-4 border-indigo-500">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
