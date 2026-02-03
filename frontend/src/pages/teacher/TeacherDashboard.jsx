import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Teacher fetched from DB
  const [teacher, setTeacher] = useState({
    name: "",
    designation: "",
  });

  const [classes, setClasses] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  /* =============================
     SUCCESS MESSAGE FROM NAV
     ============================= */
  useEffect(() => {
    if (location.state?.success) {
      setSuccessMsg(location.state.success);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  }, [location.state]);

  /* =============================
     FETCH TEACHER PROFILE
     ============================= */
  useEffect(() => {
    api
      .get("/teacher/me")
      .then((res) => {
        setTeacher({
          name: res.data.name,
          designation: res.data.designation,
        });
      })
      .catch(() => {
        // Fallback if API fails
        setTeacher({
          name: "Prof.name",
          designation: "Designation",
        });
      });
  }, []);

  /* =============================
     FETCH CLASSES
     ============================= */
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* ================= HEADER ================= */}
      <header className="
        sticky top-0 z-[100]
        bg-gradient-to-br from-indigo-500 to-purple-600
        text-white
        shadow-lg
        p-5
      ">
        <div className="
          max-w-[1200px] mx-auto
          flex items-center justify-between
        ">
          <h1 className="text-2xl font-semibold">
            👨‍🏫 Teacher Dashboard
          </h1>

          <button
            onClick={logout}
            className="
              px-5 py-2
              bg-white/20
              border border-white/30
              rounded-md
              text-sm font-medium
              transition
              hover:bg-white/30
            "
          >
            Logout
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="
        max-w-[1200px] mx-auto
        w-full
        px-5 py-8
        flex-1
      ">
        {/* ================= PROFILE ================= */}
        <section className="
          bg-white
          border border-gray-200
          rounded-xl
          p-8
          mb-8
          shadow-sm
          flex items-center justify-between
        ">
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-2">
              {teacher.name || "Loading..."}
            </h2>
            <p className="text-gray-500 text-base">
              {teacher.designation || ""}
            </p>
          </div>

          <button
            onClick={() => navigate("/teacher/profile")}
            className="
              px-6 py-3
              bg-gradient-to-br from-indigo-500 to-purple-600
              text-white
              rounded-lg
              text-sm font-semibold
              shadow-md
              transition
              hover:shadow-xl hover:-translate-y-0.5
            "
          >
            👤 Edit Profile
          </button>
        </section>

        {/* ================= SUCCESS MESSAGE ================= */}
        {successMsg && (
          <div className="
            mb-5
            px-4 py-3
            bg-green-50
            border border-green-500
            rounded-lg
            text-green-700
            text-sm font-medium
          ">
            ✓ {successMsg}
          </div>
        )}

        {/* ================= CREATE CLASS ================= */}
        <button
          onClick={() => navigate("/teacher/create")}
          className="
            mb-8
            px-6 py-3
            bg-gradient-to-br from-indigo-500 to-purple-600
            text-white
            rounded-lg
            text-sm font-semibold
            shadow-md
            transition
            hover:shadow-xl hover:-translate-y-0.5
          "
        >
          ➕ Create New Class
        </button>

        {/* ================= CLASSES ================= */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-5">
            📚 My Classes
          </h3>

          {classes.length === 0 ? (
            <div className="
              bg-white
              rounded-xl
              p-10
              text-center
              text-gray-400
              shadow-sm
            ">
              <p>No classes created yet</p>
            </div>
          ) : (
            <div className="
              grid gap-5
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
            ">
              {classes.map((cls) => {
                console.log("CLASS OBJECT:", cls); // 👈 ADD HERE

                return (
                  <div
                    key={cls._id}
                    onClick={() => navigate(`/teacher/class/${cls._id}`)}
                    className="
        bg-white
        border-2 border-gray-200
        rounded-xl
        p-5
        cursor-pointer
        shadow-sm
        transition
        hover:border-indigo-500
        hover:shadow-lg
        hover:-translate-y-1
      "
                  >
                    <div className="text-lg font-bold text-indigo-500 mb-2">
                      {cls.subjectCode}
                    </div>

                    <div className="text-lg font-normal text-red-800 mb-2">
                      {cls.subjectName}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {cls.branch} – Semester {cls.semester}
                    </p>

                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Section: {cls.section || "—"}</span>
                      <span>Group: {cls.group || "—"}</span>
                    </div>

                    <div className="mt-4 text-2xl text-indigo-500/50">
                      →
                    </div>
                  </div>
                );
              })}


            </div>
          )}
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="
        mt-8
        bg-slate-100
        border-t border-gray-200
        text-center
        py-5
        text-sm text-gray-400
      ">
        © 2026 ClassKnot • Attendance Management System
      </footer>
    </div>
  );
}
