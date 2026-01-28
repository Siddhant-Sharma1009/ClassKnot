import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function TeacherProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    designation: "",
    subjects: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/teacher/me").then(res => {
      setForm({
        name: res.data.name || "",
        designation: res.data.designation || "",
        subjects: (res.data.subjects || []).join(", "),
        password: ""
      });
    });
  }, []);

  const save = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.put("/teacher/me", {
        ...form,
        subjects: form.subjects.split(",").map(s => s.trim())
      });
      setSuccess("✓ Profile updated successfully!");
      setTimeout(() => navigate("/teacher"), 2000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* ================= HEADER ================= */}
      <header className="
        sticky top-0 z-[100]
        bg-gradient-to-br from-indigo-500 to-purple-600
        text-white shadow-lg p-5
      ">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold">👤 Edit Profile</h1>

          <button
            onClick={() => navigate("/teacher")}
            className="
              px-5 py-2
              bg-white/20 border border-white/30
              rounded-md text-sm font-medium
              transition hover:bg-white/30
            "
          >
            ← Back
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-[600px] mx-auto w-full px-5 py-8 flex-1">
        <div className="
          bg-white border border-gray-200
          rounded-xl p-10 shadow-sm
        ">
          {/* Error */}
          {error && (
            <div className="
              mb-5 px-4 py-3
              bg-red-50 border border-red-500
              rounded-lg text-red-700
              text-sm font-medium
            ">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="
              mb-5 px-4 py-3
              bg-green-50 border border-green-500
              rounded-lg text-green-700
              text-sm font-medium
            ">
              {success}
            </div>
          )}

          {/* Form */}
          <div className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="
                  w-full px-4 py-3 text-sm
                  border-2 border-gray-200 rounded-lg
                  outline-none transition
                  focus:border-indigo-500
                  focus:ring-4 focus:ring-indigo-500/10
                "
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Designation
              </label>
              <input
                type="text"
                value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
                className="
                  w-full px-4 py-3 text-sm
                  border-2 border-gray-200 rounded-lg
                  outline-none transition
                  focus:border-indigo-500
                  focus:ring-4 focus:ring-indigo-500/10
                "
              />
            </div>

            {/* Subjects */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Subjects (comma separated)
              </label>
              <input
                type="text"
                value={form.subjects}
                onChange={e => setForm({ ...form, subjects: e.target.value })}
                placeholder="e.g., DBMS, Data Structures, Algorithms"
                className="
                  w-full px-4 py-3 text-sm
                  border-2 border-gray-200 rounded-lg
                  outline-none transition
                  focus:border-indigo-500
                  focus:ring-4 focus:ring-indigo-500/10
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter new password"
                className="
                  w-full px-4 py-3 text-sm
                  border-2 border-gray-200 rounded-lg
                  outline-none transition
                  focus:border-indigo-500
                  focus:ring-4 focus:ring-indigo-500/10
                "
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={save}
              disabled={loading}
              className={`
                flex-1 py-3 rounded-lg
                text-sm font-semibold text-white
                transition
                ${loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-xl hover:-translate-y-0.5"}
              `}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={logout}
              className="
                flex-1 py-3
                bg-white text-indigo-500
                border-2 border-indigo-500
                rounded-lg text-sm font-semibold
                transition hover:bg-indigo-50
              "
            >
              Logout
            </button>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="
        bg-slate-100 border-t border-gray-200
        text-center py-5
        text-sm text-gray-400
      ">
        © 2026 ClassKnot • Attendance Management System
      </footer>
    </div>
  );
}
