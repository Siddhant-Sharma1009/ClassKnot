import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function SubjectAttendance() {
  const { subjectId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/hod/subject/${subjectId}/attendance`)
      .then(res => setData(res.data));
  }, [subjectId]);

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Attendance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">

      {/* SUBJECT INFO */}
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold">{data.subjectName}</h1>
        <p className="text-gray-500">
          Teacher: {data.teacherName}
        </p>
      </div>

      {/* GRAPH */}
      <div className="bg-white rounded-xl shadow p-6 h-80">
        <h2 className="font-semibold mb-4">Attendance Overview</h2>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.students}>
            <XAxis dataKey="roll" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="percentage" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* STUDENT LIST */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-4">Student Attendance</h2>

        <table className="w-full text-sm border">
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
            {data.students.map(s => (
              <tr key={s.roll} className="text-center">
                <td className="border p-2">{s.roll}</td>
                <td className="border p-2">{s.name}</td>
                <td className="border p-2">{s.present}</td>
                <td className="border p-2">{s.total}</td>
                <td className="border p-2 font-medium">
                  {s.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
