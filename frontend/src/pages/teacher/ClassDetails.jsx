import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function ClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  /* =============================
     FETCH ATTENDANCE HISTORY
     ============================= */
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await api.get(`/attendance/slots/${classId}`);
        setSlots(res.data || []);
      } catch (err) {
        console.error("Failed to load slots", err);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [classId]);

  /* =============================
     CREATE SLOT (COMMON)
     ============================= */
  const createSlot = async () => {
    if (creating) return null;

    try {
      setCreating(true);
      const res = await api.post(`/attendance/slot/${classId}`);
      return res.data?._id || null;
    } catch (err) {
      alert("Failed to start attendance");
      return null;
    } finally {
      setCreating(false);
    }
  };

  /* =============================
     MANUAL ATTENDANCE
     ============================= */
  const startManual = async () => {
    const slotId = await createSlot();
    if (slotId) {
      navigate(`/teacher/attendance/${slotId}`);
    }
  };

  /* =============================
     QR ATTENDANCE
     ============================= */
  const startQR = async () => {
    const slotId = await createSlot();
    if (slotId) {
      navigate(`/teacher/qr/start/${slotId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 flex justify-center">
      <div className="w-full max-w-[700px]">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Class Attendance
        </h2>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={startManual}
            disabled={creating}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold
              transition
              ${
                creating
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }
            `}
          >
            📝 Manual Attendance
          </button>

          <button
            onClick={startQR}
            disabled={creating}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold
              transition
              ${
                creating
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              }
            `}
          >
            📱 QR Attendance
          </button>

          <button
            onClick={() =>
              navigate(`/teacher/attendance-summary/${classId}`)
            }
            className="
              px-4 py-2 rounded-lg text-sm font-semibold
              bg-slate-200 text-gray-800
              transition hover:bg-slate-300
            "
          >
            📊 Attendance Summary
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Attendance History
        </h3>

        {loading && (
          <p className="text-gray-500">Loading...</p>
        )}

        {!loading && slots.length === 0 && (
          <p className="text-gray-400">
            No attendance taken yet
          </p>
        )}

        {!loading && (
          <div className="flex flex-col gap-3">
            {slots.map(slot => (
              <div
                key={slot._id}
                onClick={() =>
                  navigate(`/teacher/attendance/${slot._id}`)
                }
                className="
                  cursor-pointer
                  bg-white
                  border border-gray-200
                  rounded-lg
                  p-4
                  transition
                  hover:shadow-md hover:border-indigo-500
                "
              >
                <div className="text-sm text-gray-700 mb-1">
                  📅{" "}
                  <strong>
                    {new Date(slot.date).toDateString()}
                  </strong>
                </div>
                <div className="text-sm text-gray-600">
                  ⏰ <strong>{slot.startTime}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
