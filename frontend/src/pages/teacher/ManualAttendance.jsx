import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function ManualAttendance() {
  const { slotId } = useParams();   // 🔥 MUST MATCH ROUTE
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =============================
     SAFETY CHECK
     ============================= */
  useEffect(() => {
    if (!slotId) {
      console.error("slotId is undefined");
      setLoading(false);
    }
  }, [slotId]);

  /* =============================
     FETCH ATTENDANCE RECORDS
     ============================= */
  useEffect(() => {
    if (!slotId) return;

    const fetchRecords = async () => {
      try {
        const res = await api.get(
          `/attendance/slot-records/${slotId}`
        );
        setRecords(res.data || []);
      } catch (err) {
        console.error("Failed to load attendance", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [slotId]);

  /* =============================
     TOGGLE STATUS
     ============================= */
  const toggleStatus = (recordId) => {
    setRecords(prev =>
      prev.map(r =>
        r._id === recordId
          ? { ...r, status: r.status === "P" ? "A" : "P" }
          : r
      )
    );
  };

  /* =============================
     SAVE ATTENDANCE
     ============================= */
  const saveAttendance = async () => {
    try {
      await api.post("/attendance/manual-update", {
        records: records.map(r => ({
          recordId: r._id,
          status: r.status
        }))
      });

      alert("Attendance saved successfully");
      navigate(-1);
    } catch (err) {
      alert("Failed to save attendance");
    }
  };

  /* =============================
     UI STATES
     ============================= */
  if (!slotId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-red-600 font-medium">
          Invalid attendance slot
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500">
          Loading attendance…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 flex justify-center">
      <div className="w-full max-w-[650px]">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Manual Attendance
        </h2>

        {records.length === 0 && (
          <p className="text-gray-400">
            No students found
          </p>
        )}

        {records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="
              w-full
              border border-gray-200
              rounded-lg
              overflow-hidden
              text-sm
            ">
              <thead>
                <tr className="bg-slate-100 border-b border-gray-200">
                  <th className="text-left p-3">College ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {records.map(r => (
                  <tr
                    key={r._id}
                    className="border-b border-gray-100 hover:bg-slate-50"
                  >
                    <td className="p-3">
                      {r.studentId.collegeId}
                    </td>
                    <td className="p-3">
                      {r.studentId.name}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleStatus(r._id)}
                        className={`
                          px-4 py-1.5
                          rounded-full
                          text-xs font-semibold
                          transition
                          ${
                            r.status === "P"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }
                        `}
                      >
                        {r.status === "P" ? "Present" : "Absent"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SAVE BUTTON */}
        {records.length > 0 && (
          <button
            onClick={saveAttendance}
            className="
              mt-6
              w-full
              py-3
              bg-gradient-to-br from-indigo-500 to-purple-600
              text-white
              rounded-lg
              font-semibold
              transition
              hover:shadow-xl hover:-translate-y-0.5
            "
          >
            Save Attendance
          </button>
        )}
      </div>
    </div>
  );
}
