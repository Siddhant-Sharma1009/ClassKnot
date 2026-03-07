import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/qrExperience.css";

export default function StartQR() {
  const { slotId } = useParams();
  const navigate = useNavigate();

  const start = async () => {
    const res = await api.post("/qr/start", {
      attendanceSlotId: slotId
    });

    navigate(`/teacher/qr/live/${res.data._id}`);
  };

  return (
    <div className="qr-screen">
      <div className="qr-card" style={{ maxWidth: "820px" }}>
        <h1 className="qr-title">Launch QR Attendance</h1>
        <p className="qr-sub">
          Optimized for classroom smart boards with high contrast and larger scan zone.
        </p>
        <div className="action-stack" style={{ marginTop: 22 }}>
          <button onClick={start} className="btn-main">
            Start Live QR Session
          </button>
          <button onClick={() => navigate(-1)} className="btn-alt">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
