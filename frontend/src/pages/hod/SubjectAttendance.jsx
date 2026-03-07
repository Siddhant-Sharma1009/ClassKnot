import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

export default function SubjectAttendance() {
  const { subjectId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/hod/subject/${subjectId}/attendance`)
      .then(res => {
        setData(res.data);
        setError("");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load subject attendance");
      });
  }, [subjectId]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Attendance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6 space-y-5 md:space-y-8">

      {/* SUBJECT INFO */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6">
        <h1 className="text-2xl font-bold">{data.subjectName}</h1>
        <p className="text-gray-500">
          Teacher: {data.teacherName}
        </p>
        <p className="text-gray-500">
          Total Slots: {data.totalSlots ?? 0} | Overall Attendance: {data.overallPercentage ?? 0}%
        </p>
      </div>

      {/* GRAPH */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <div className="bg-white rounded-xl shadow p-4 md:p-6 h-80">
          <h2 className="font-semibold mb-4">Attendance Overview</h2>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.students}>
              <XAxis dataKey="roll" hide={data.students.length > 10} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentage" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-4 md:p-6 h-80">
          <h2 className="font-semibold mb-4">Student Status</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: ">= 75%", value: data.students.filter((s) => s.percentage >= 75).length },
                  { name: "< 75%", value: data.students.filter((s) => s.percentage < 75).length }
                ]}
                dataKey="value"
                nameKey="name"
                outerRadius={96}
                innerRadius={52}
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

      {/* STUDENT LIST */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6">
        <h2 className="font-semibold mb-4">Student Attendance</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border min-w-[560px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Roll</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Present</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">%</th>
              </tr>
            </thead>
            <tbody>
              {data.students.length === 0 ? (
                <tr>
                  <td className="border p-2 text-center" colSpan={5}>
                    No attendance records found for this subject yet.
                  </td>
                </tr>
              ) : (
                data.students.map(s => (
                  <tr key={s.roll} className="text-center">
                    <td className="border p-2">{s.roll}</td>
                    <td className="border p-2">{s.name}</td>
                    <td className="border p-2">{s.present}</td>
                    <td className="border p-2">{s.total}</td>
                    <td className="border p-2 font-medium">
                      {s.percentage}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
