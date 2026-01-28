import { useEffect, useState } from "react";
import axios from "../../utils/axios";
import { useNavigate } from "react-router-dom";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/student/attendance")
      .then(res => setAttendance(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return ( 
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* ================= HEADER ================= */}
      <header className="
        sticky top-0 z-50
        bg-gradient-to-br from-indigo-500 to-purple-600
        text-white shadow-lg
        p-5
      ">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            📊 My Attendance
          </h1>

          <button
            onClick={() => navigate(-1)}
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
      <main className="max-w-[1200px] mx-auto w-full px-5 py-8 flex-1">
        {loading ? (
          <div className="
            bg-white
            rounded-xl
            p-10
            text-center
            shadow-sm
          ">
            <p className="text-gray-500 text-base">
              Loading attendance data…
            </p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="
            bg-white
            rounded-xl
            p-10
            text-center
            shadow-sm
          ">
            <p className="text-gray-400 text-base">
              No attendance records found
            </p>
          </div>
        ) : (
          <div className="
            bg-white
            rounded-xl
            p-6
            shadow-sm
            border border-gray-200
            overflow-x-auto
          ">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-gray-200">
                  <th className="p-4 text-left font-semibold text-gray-700 border-r">
                    📚 Subject
                  </th>
                  <th className="p-4 text-center font-semibold text-gray-700 border-r">
                    ✓ Present
                  </th>
                  <th className="p-4 text-center font-semibold text-gray-700 border-r">
                    📊 Total
                  </th>
                  <th className="p-4 text-center font-semibold text-gray-700">
                    % Percentage
                  </th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((a, i) => (
                  <tr
                    key={i}
                    className="
                      border-b border-gray-200
                      odd:bg-slate-50
                      even:bg-white
                      transition
                      hover:bg-indigo-50
                    "
                  >
                    <td className="p-4 text-gray-700 font-medium border-r">
                      {a.subject}
                    </td>
                    <td className="p-4 text-center text-green-700 font-bold border-r">
                      {a.present}
                    </td>
                    <td className="p-4 text-center text-gray-600 border-r">
                      {a.total}
                    </td>
                    <td className="p-4 text-center text-indigo-600 font-bold">
                      {a.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="
        border-t
        text-center
        py-5
        text-sm text-gray-400
      ">
        © 2026 ClassKnot • Attendance Management System
      </footer>
    </div>
  );
}
