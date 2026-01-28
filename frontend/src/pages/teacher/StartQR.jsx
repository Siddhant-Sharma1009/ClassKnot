import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function StartQR() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState("");

  const start = async () => {
    if (!rows || rows < 1) {
      alert("Enter valid number of rows");
      return;
    }

    const res = await api.post("/qr/start", {
      attendanceSlotId: slotId,
      totalRows: Number(rows)
    });

    navigate(`/teacher/qr/live/${res.data._id}`);
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
          Start QR Attendance
        </h2>

        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            No. of Rows
          </label>

          <input
            type="number"
            value={rows}
            onChange={e => setRows(e.target.value)}
            placeholder="Enter number of rows"
            className="
              w-full px-4 py-3
              border-2 border-gray-200
              rounded-lg text-sm
              outline-none transition
              focus:border-indigo-500
              focus:ring-4 focus:ring-indigo-500/10
            "
          />
        </div>

        <button
          onClick={start}
          className="
            w-full py-3
            bg-gradient-to-br from-indigo-500 to-purple-600
            text-white
            rounded-lg
            font-semibold
            transition
            hover:shadow-xl hover:-translate-y-0.5
          "
        >
          Start QR
        </button>
      </div>
    </div>
  );
}
