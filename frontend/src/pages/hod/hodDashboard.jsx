import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import HodHeader from "./hodHeader";

/* =========================
   Subject Card
========================= */
function SubjectCard({ subject, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-lg transition border-l-4 border-blue-600"
    >
      <h3 className="text-lg font-semibold text-gray-800">
        {subject.name}
      </h3>

      <p className="text-sm text-gray-500">
        Code: {subject.code}
      </p>

      <p className="text-sm text-gray-500">
        Semester: {subject.semester ?? "N/A"}
      </p>

      <p className="mt-2 text-sm">
        👨‍🏫 Teacher:{" "}
        <span className="font-medium text-gray-700">
          {subject.teacherName || "Not Assigned"}
        </span>
      </p>
    </div>
  );
}

export default function HodDashboard() {
  const [hod, setHod] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    Promise.all([
      api.get("/hod/me"),
      api.get("/hod/subjects")
    ])
      .then(([profileRes, subjectsRes]) => {
        setHod(profileRes.data);
        setSubjects(subjectsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     SEMESTER OPTIONS
  ========================= */
  const semesters = [
    "ALL",
    ...Array.from(
      new Set(subjects.map(s => s.semester).filter(Boolean))
    ).sort((a, b) => a - b)
  ];

  /* =========================
     FILTERED SUBJECTS
  ========================= */
  const filteredSubjects =
    selectedSemester === "ALL"
      ? subjects
      : subjects.filter(
          s => s.semester === Number(selectedSemester)
        );

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading HOD Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <HodHeader
        collegeId={hod?.collegeId}
        branch={hod?.branch || "Branch"}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* =========================
           HOD INFO
        ========================= */}
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {hod?.name || "Head of Department"}
          </h1>

          <p className="text-gray-500">
            {hod?.designation || "HOD"}
          </p>

          <p className="text-sm text-gray-400">
            Branch: {hod?.branch || "N/A"}
          </p>
        </div>

        {/* =========================
           SUBJECT LIST + FILTER
        ========================= */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Subjects & Assigned Teachers
            </h2>

            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>
                  {sem === "ALL"
                    ? "All Semesters"
                    : `Semester ${sem}`}
                </option>
              ))}
            </select>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-gray-500 text-center">
              No subjects found for selected semester.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map(subject => (
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  onClick={() =>
                    navigate(`/hod/subject/${subject._id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
