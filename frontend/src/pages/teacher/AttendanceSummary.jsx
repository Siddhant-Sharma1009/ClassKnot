import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

export default function AttendanceSummary() {
  const { classId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get(`/attendance/summary/${classId}?min=75`)
      .then(res => setData(res.data))
      .catch(err => console.error("Summary load failed", err));
  }, [classId]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          Loading attendance summary…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ================= HEADER ================= */}
      <div className="
        bg-gradient-to-br from-indigo-500 to-purple-600
        text-white text-center
        py-10 shadow-md
      ">
        <h1 className="text-3xl font-semibold mb-2">
          Attendance Summary
        </h1>
        <p className="text-sm text-white/80">
          Class-wise attendance & defaulter analysis
        </p>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-[1200px] mx-auto px-5 py-8 space-y-6">
        {/* OVERVIEW */}
        <div className="
          bg-white
          rounded-xl
          shadow-sm
          border border-gray-200
          p-6
          text-center
        ">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Total Classes Conducted
          </h3>
          <div className="text-3xl font-semibold text-indigo-600">
            {data.totalSlots}
          </div>
        </div>

        {/* TABLE */}
        <div className="
          bg-white
          rounded-xl
          shadow-sm
          border border-gray-200
          p-6
        ">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Student Attendance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-gray-200">
                  <th className="text-left p-3">College ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-center p-3">Present</th>
                  <th className="text-center p-3">%</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {data.students.map(s => (
                  <tr
                    key={s.studentId}
                    className="border-b border-gray-100 hover:bg-slate-50"
                  >
                    <td className="p-3">{s.collegeId}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3 text-center">
                      {s.present}/{s.totalSlots}
                    </td>
                    <td className="p-3 text-center">
                      {s.percentage}%
                    </td>
                    <td className="p-3 text-center">
                      {s.isDefaulter ? (
                        <span className="
                          text-red-600 font-medium
                        ">
                          ❌ Defaulter
                        </span>
                      ) : (
                        <span className="
                          text-green-600 font-medium
                        ">
                          ✅ OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DEFAULTERS */}
        <div className="
          bg-white
          rounded-xl
          shadow-sm
          border border-gray-200
          p-6
        ">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Defaulters{" "}
            <span className="text-red-600">
              ({data.defaulters.length})
            </span>
          </h3>

          {data.defaulters.length === 0 ? (
            <p className="text-green-600 font-medium m-0">
              🎉 No defaulters in this class
            </p>
          ) : (
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {data.defaulters.map(d => (
                <li key={d.studentId}>
                  <strong>{d.collegeId}</strong> – {d.name} (
                  <span className="text-red-600 font-medium">
                    {d.percentage}%
                  </span>
                  )
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* FOOTER */}
        <div className="
          text-center
          text-sm text-gray-400
          pt-6
        ">
          © {new Date().getFullYear()} ClassKnot · Attendance Management System
        </div>
      </div>
    </div>
  );
}
