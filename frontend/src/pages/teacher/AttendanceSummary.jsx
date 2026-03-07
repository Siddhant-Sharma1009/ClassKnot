import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/axios";
import "../../styles/teacherExperience.css";

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function AttendanceSummary() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [minPercentage, setMinPercentage] = useState(75);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("percentage");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/attendance/summary/${classId}?min=${minPercentage}`);
        setData(res.data);
      } catch {
        setData({ totalSlots: 0, students: [], defaulters: [] });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [classId, minPercentage]);

  const students = data?.students || [];

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = students.filter((s) => {
      const matchesQuery =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        String(s.collegeId || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "DEFAULTER" && s.isDefaulter) ||
        (statusFilter === "OK" && !s.isDefaulter);

      return matchesQuery && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }, [students, search, statusFilter, sortBy, sortDir]);

  const stats = useMemo(() => {
    if (students.length === 0) {
      return {
        avgPercentage: 0,
        topCount: 0,
        midCount: 0,
        riskCount: 0
      };
    }

    const avg = students.reduce((sum, s) => sum + Number(s.percentage || 0), 0) / students.length;

    const topCount = students.filter((s) => Number(s.percentage) >= 85).length;
    const midCount = students.filter((s) => Number(s.percentage) >= 75 && Number(s.percentage) < 85).length;
    const riskCount = students.filter((s) => Number(s.percentage) < 75).length;

    return {
      avgPercentage: Number(avg.toFixed(2)),
      topCount,
      midCount,
      riskCount
    };
  }, [students]);

  const bucketChartData = useMemo(
    () => [
      { name: "Top (>=85%)", count: stats.topCount },
      { name: "Stable (75-84%)", count: stats.midCount },
      { name: "Risk (<75%)", count: stats.riskCount }
    ],
    [stats]
  );

  const exportCsv = () => {
    const rows = [["College ID", "Name", "Present", "Total", "Percentage", "Status"]];

    filteredStudents.forEach((s) => {
      rows.push([s.collegeId, s.name, s.present, s.totalSlots, s.percentage, s.isDefaulter ? "Defaulter" : "OK"]);
    });

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance-summary-${classId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="teacher-shell">
        <div className="teacher-wrap" style={{ maxWidth: 900 }}>
          <div className="teacher-panel">
            <p className="teacher-sub">Loading attendance summary...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-shell">
      <div className="teacher-wrap">
        <div className="teacher-panel">
          <h1 className="teacher-title">Attendance Summary</h1>
          <p className="teacher-sub">Analyze attendance quality, identify risks, and export filtered insights.</p>

          <div className="teacher-actions">
            <button onClick={() => navigate(-1)} className="btn-ghost">Back</button>
            <button onClick={exportCsv} className="btn-ghost">Export CSV</button>
          </div>

          <div className="teacher-grid">
            <div className="teacher-panel">
              <p className="teacher-sub" style={{ marginTop: 0 }}>Total Classes Conducted</p>
              <p className="text-4xl font-bold text-blue-700" style={{ marginTop: 6 }}>{data.totalSlots}</p>
            </div>
            <div className="teacher-panel">
              <p className="teacher-sub" style={{ marginTop: 0 }}>Average Attendance</p>
              <p className="text-4xl font-bold text-indigo-700" style={{ marginTop: 6 }}>{stats.avgPercentage}%</p>
            </div>
            <div className="teacher-panel">
              <p className="teacher-sub" style={{ marginTop: 0 }}>Defaulters (&lt;{minPercentage}%)</p>
              <p className="text-4xl font-bold text-red-600" style={{ marginTop: 6 }}>{data.defaulters.length}</p>
            </div>
            <div className="teacher-panel">
              <p className="teacher-sub" style={{ marginTop: 0 }}>Performance Buckets</p>
              <p className="text-sm text-slate-700 mt-2">Top: {stats.topCount} | Stable: {stats.midCount} | At risk: {stats.riskCount}</p>
            </div>
          </div>

          <div className="teacher-grid" style={{ marginTop: 14 }}>
            <div className="teacher-chart-card" style={{ height: 260 }}>
              <p className="text-sm font-semibold text-slate-700">Student Distribution</p>
              <ResponsiveContainer width="100%" height="88%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Defaulters", value: data.defaulters.length },
                      { name: "OK", value: Math.max(0, students.length - data.defaulters.length) }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={78}
                    innerRadius={44}
                    label
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#16a34a" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="teacher-chart-card" style={{ height: 260 }}>
              <p className="text-sm font-semibold text-slate-700">Performance Buckets</p>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={bucketChartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    <Cell fill="#22c55e" />
                    <Cell fill="#eab308" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="teacher-grid" style={{ marginTop: 14 }}>
            <input
              className="input-field"
              type="text"
              placeholder="Search by name or college ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Students</option>
              <option value="DEFAULTER">Defaulters</option>
              <option value="OK">OK</option>
            </select>
            <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="percentage">Sort by %</option>
              <option value="present">Sort by Present</option>
              <option value="collegeId">Sort by College ID</option>
              <option value="name">Sort by Name</option>
            </select>
            <select className="input-field" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <label className="teacher-sub" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 0 }}>
              Defaulter cutoff:
              <input
                type="number"
                min={0}
                max={100}
                value={minPercentage}
                onChange={(e) => setMinPercentage(Number(e.target.value) || 0)}
                className="input-field"
                style={{ width: 110, padding: "8px 10px" }}
              />
            </label>
          </div>

          <div className="teacher-panel" style={{ marginTop: 14, padding: 0, overflowX: "auto" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="text-left p-3">College ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-center p-3">Present</th>
                  <th className="text-center p-3">%</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{s.collegeId}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3 text-center">{s.present}/{s.totalSlots}</td>
                    <td className="p-3 text-center">{s.percentage}%</td>
                    <td className="p-3 text-center">
                      {s.isDefaulter ? (
                        <span className="font-semibold text-red-600">Defaulter</span>
                      ) : (
                        <span className="font-semibold text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-slate-500">No students match current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="teacher-panel" style={{ marginTop: 14 }}>
            <h3 className="text-xl font-semibold">Defaulter List</h3>
            {data.defaulters.length === 0 ? (
              <p className="teacher-sub">No defaulters in this class.</p>
            ) : (
              <ul className="mt-3 list-disc pl-5 text-sm space-y-1">
                {data.defaulters.map((d) => (
                  <li key={d.studentId}>
                    <strong>{d.collegeId}</strong> - {d.name} ({d.percentage}%)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
