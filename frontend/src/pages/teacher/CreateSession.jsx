import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/teacherExperience.css";

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
  const [subjectName, setSubjectName] = useState("");

  useEffect(() => {
    if (!branch || !semester) {
      setSubjects([]);
      setSubjectCode("");
      setSubjectName("");
      return;
    }

    api
      .get(`/subjects?branch=${branch}&semester=${semester}`)
      .then((res) => setSubjects(res.data))
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
        subjectName,
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
    <div className="teacher-shell">
      <div className="teacher-wrap" style={{ maxWidth: 680 }}>
        <div className="teacher-panel">
          <h1 className="teacher-title">Create Class Session</h1>
          <p className="teacher-sub">Choose semester, branch, and subject details.</p>

          <div className="teacher-grid" style={{ marginTop: 16 }}>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field">
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setSection("");
                setGroup("");
                setSubjectCode("");
                setSubjectName("");
              }}
              className="input-field"
            >
              <option value="">Select Branch</option>
              {["CSE", "EEE", "ME", "CE"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {branch && (
              <select value={section} onChange={(e) => setSection(e.target.value)} className="input-field">
                <option value="">Select Section (optional)</option>
                {BRANCH_SECTIONS[branch].map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            )}

            {branch && semester && (
              <select value={group} onChange={(e) => setGroup(e.target.value)} className="input-field">
                <option value="">Select Group (optional)</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>Group {g}</option>
                ))}
              </select>
            )}

            {branch && semester && (
              <select
                value={subjectCode}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  const selectedSubject = subjects.find((s) => s.code === selectedCode);
                  setSubjectCode(selectedCode);
                  setSubjectName(selectedSubject?.name || "");
                }}
                className="input-field"
                style={{ gridColumn: "1 / -1" }}
              >
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="teacher-actions">
            <button onClick={createSession} className="btn-primary">Create Class</button>
            <button onClick={() => navigate(-1)} className="btn-ghost">Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}
