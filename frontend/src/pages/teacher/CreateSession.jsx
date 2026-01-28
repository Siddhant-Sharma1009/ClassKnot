import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const BRANCH_SECTIONS = {
  CSE: ["A", "B"],
  EEE: ["A", "B"],
  ME: ["A"],
  CE: ["A"]
};

const GROUPS = ["1", "2", "3"];

export default function CreateSession() {
  const navigate = useNavigate();

  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [group, setGroup] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectCode, setSubjectCode] = useState("");

  useEffect(() => {
    if (!branch || !semester) {
      setSubjects([]);
      setSubjectCode("");
      return;
    }

    api
      .get(`/subjects?branch=${branch}&semester=${semester}`)
      .then(res => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, [branch, semester]);

  const createSession = async () => {
    if (!branch || !semester || !subjectCode) {
      return alert("Branch, Semester and Subject are mandatory");
    }

    try {
      await api.post("/session/create", {
        branch,
        semester: Number(semester),
        subjectCode,
        section: section || null,
        group: group || null
      });

      navigate("/teacher", {
        state: { success: "Class created successfully" }
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create class");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="
        w-full max-w-[420px]
        bg-white
        border border-gray-200
        rounded-xl
        shadow-sm
        p-6
      ">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Create New Class
        </h2>

        <div className="flex flex-col gap-4">
          {/* Semester */}
          <select
            value={semester}
            onChange={e => setSemester(e.target.value)}
            className="
              w-full px-4 py-3
              border-2 border-gray-200
              rounded-lg text-sm
              outline-none transition
              focus:border-indigo-500
              focus:ring-4 focus:ring-indigo-500/10
            "
          >
            <option value="">Select Semester</option>
            {[1,2,3,4,5,6,7,8].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Branch */}
          <select
            value={branch}
            onChange={e => {
              setBranch(e.target.value);
              setSection("");
              setGroup("");
              setSubjectCode("");
            }}
            className="
              w-full px-4 py-3
              border-2 border-gray-200
              rounded-lg text-sm
              outline-none transition
              focus:border-indigo-500
              focus:ring-4 focus:ring-indigo-500/10
            "
          >
            <option value="">Select Branch</option>
            {["CSE","EEE","ME","CE"].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Section (optional) */}
          {branch && (
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="
                w-full px-4 py-3
                border-2 border-gray-200
                rounded-lg text-sm
                outline-none transition
                focus:border-indigo-500
                focus:ring-4 focus:ring-indigo-500/10
              "
            >
              <option value="">Select Section (optional)</option>
              {BRANCH_SECTIONS[branch].map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          )}

          {/* Group (optional) */}
          {branch && semester && (
            <select
              value={group}
              onChange={e => setGroup(e.target.value)}
              className="
                w-full px-4 py-3
                border-2 border-gray-200
                rounded-lg text-sm
                outline-none transition
                focus:border-indigo-500
                focus:ring-4 focus:ring-indigo-500/10
              "
            >
              <option value="">Select Group (optional)</option>
              {GROUPS.map(g => (
                <option key={g} value={g}>Group {g}</option>
              ))}
            </select>
          )}

          {/* Subject */}
          {branch && semester && (
            <select
              value={subjectCode}
              onChange={e => setSubjectCode(e.target.value)}
              className="
                w-full px-4 py-3
                border-2 border-gray-200
                rounded-lg text-sm
                outline-none transition
                focus:border-indigo-500
                focus:ring-4 focus:ring-indigo-500/10
              "
            >
              <option value="">Select Subject</option>
              {subjects.map(sub => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          )}

          {/* Button */}
          <button
            onClick={createSession}
            className="
              mt-2
              py-3
              bg-gradient-to-br from-indigo-500 to-purple-600
              text-white
              rounded-lg
              text-sm font-semibold
              transition
              hover:shadow-xl hover:-translate-y-0.5
            "
          >
            Create Class
          </button>
        </div>
      </div>
    </div>
  );
}
