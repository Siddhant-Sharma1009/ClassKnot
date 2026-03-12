import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/qrExperience.css";

const formatMediaError = (err) => {
  const name = err?.name || "";
  if (name === "NotAllowedError") return "Camera permission denied. Please allow access and try again.";
  if (name === "NotFoundError") return "No camera device found on this device.";
  if (name === "NotReadableError") return "Camera is already in use by another app.";
  if (name === "OverconstrainedError") return "Selected camera does not support the requested settings.";
  if (name === "SecurityError") return "Camera access requires HTTPS or localhost.";
  return "Failed to start the selected camera. Try another device.";
};

export default function QRPreview() {
  const { qrSessionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameTimerRef = useRef(null);
  const frameBusyRef = useRef(false);

  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [aiCount, setAiCount] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    api
      .get(`/qr/preview/${qrSessionId}`)
      .then((res) => {
        setData(res.data);
        setPageError("");
      })
      .catch(() => setPageError("Failed to load preview."));
  }, [qrSessionId]);

  const stopCameraStream = async () => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    frameBusyRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setAiRunning(false);
  };

  const loadCameras = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support device cameras.");
      return;
    }

    try {
      setCameraError("");
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      permissionStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");

      setCameraDevices(videoInputs);
      if (!selectedCameraId && videoInputs.length > 0) {
        const preferred = [...videoInputs].sort((a, b) => {
          const rank = (label = "") => {
            const text = label.toLowerCase();
            if (/(smart|board|usb|external|conference)/.test(text)) return 0;
            if (/(rear|back|environment)/.test(text)) return 1;
            if (/(front|facetime|integrated|laptop)/.test(text)) return 2;
            return 3;
          };
          return rank(a.label) - rank(b.label);
        })[0];

        setSelectedCameraId(preferred.deviceId);
      }
    } catch {
      setCameraError("Allow camera access to choose the smartboard or laptop camera.");
    }
  };

  useEffect(() => {
    loadCameras();

    return () => {
      stopCameraStream();
      api.post("/ai/stop").catch(() => {});
    };
  }, []);

  const selectedCamera = useMemo(
    () => cameraDevices.find((device) => device.deviceId === selectedCameraId) || null,
    [cameraDevices, selectedCameraId]
  );

  const save = async () => {
    try {
      setSaving(true);
      await api.post(`/qr/save/${qrSessionId}`);
      alert("Attendance saved successfully");
      navigate("/teacher");
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const retake = async () => {
    try {
      const res = await api.post(`/qr/retake/${qrSessionId}`);
      navigate(`/teacher/qr/start/${res.data.attendanceSlotId}`);
    } catch {
      alert("Failed to retake QR");
    }
  };

  const captureAndCountFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || frameBusyRef.current) return;

    frameBusyRef.current = true;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 540;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/jpeg", 0.7);

    try {
      const res = await api.post("/ai/count-frame", {
        image,
        profile: "front_center",
        source: selectedCamera?.label || "device_camera"
      });

      if (res.data.error) {
        setCameraError(res.data.error);
        setAiCount(null);
        await stopAiCounting();
        return;
      }

      setAiCount(res.data.count ?? 0);
      setCameraError("");
    } catch {
      setCameraError("Unable to process camera frames right now.");
      await stopAiCounting();
    } finally {
      frameBusyRef.current = false;
    }
  };

  const startAiCounting = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support device cameras.");
      return;
    }

    try {
      setAiLoading(true);
      setCameraError("");
      setAiCount(null);

      await stopCameraStream();

      const baseVideo = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 15, max: 24 }
      };

      const constraintOptions = selectedCameraId
        ? [
            { audio: false, video: { ...baseVideo, deviceId: { exact: selectedCameraId } } },
            { audio: false, video: { ...baseVideo, deviceId: { ideal: selectedCameraId } } },
            { audio: false, video: { ...baseVideo, facingMode: { ideal: "environment" } } }
          ]
        : [{ audio: false, video: { ...baseVideo, facingMode: { ideal: "environment" } } }];

      let stream = null;
      let lastError = null;

      for (const constraints of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        throw lastError || new Error("Camera start failed");
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await api.post("/ai/start", {
        source: selectedCamera?.label || "device_camera",
        profile: "front_center",
        sourceType: "browser"
      });

      setAiRunning(true);
      frameTimerRef.current = setInterval(captureAndCountFrame, 1500);
      await captureAndCountFrame();
    } catch (err) {
      setCameraError(formatMediaError(err));
      await stopCameraStream();
    } finally {
      setAiLoading(false);
    }
  };

  const stopAiCounting = async () => {
    try {
      await api.post("/ai/stop");
    } catch {
    } finally {
      await stopCameraStream();
    }
  };

  if (!data) {
    return (
      <div className="qr-screen">
        <p className="text-gray-500">{pageError || "Loading preview..."}</p>
      </div>
    );
  }

  const totalSubmissions = data.totalSubmissions || 0;

  return (
    <div className="qr-screen">
      <div className="qr-card">
        <h1 className="qr-title">QR Attendance Preview</h1>
        <p className="qr-sub">Review responses, then confirm and save attendance.</p>

        <div className="qr-grid">
          <div className="qr-panel">
            <h3 className="text-xl font-semibold">Session Summary</h3>
            <p className="qr-sub" style={{ marginTop: 8 }}>
              Total submissions: <strong>{totalSubmissions}</strong>
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-2">Submitted Student IDs</h4>
            <ul className="preview-list">
              {(data.submissions || []).map((s, idx) => (
                <li key={s._id || idx}>{s.studentId?.collegeId || "N/A"}</li>
              ))}
            </ul>
          </div>

          <div className="qr-panel">
            <h3 className="text-xl font-semibold">AI Attendance</h3>
            <p className="qr-sub">Optional real-time estimate from this device camera.</p>

            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full px-3 py-3 border rounded-lg text-sm mt-3"
              disabled={aiLoading || cameraDevices.length === 0}
            >
              {cameraDevices.length === 0 ? (
                <option value="">No camera detected</option>
              ) : (
                cameraDevices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))
              )}
            </select>

            <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", background: "#111827" }}>
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                style={{ width: "100%", minHeight: 220, objectFit: "cover" }}
              />
            </div>

            {cameraError && (
              <p className="qr-sub" style={{ color: "#b91c1c", marginTop: 10 }}>
                {cameraError}
              </p>
            )}

            <button
              onClick={aiRunning ? stopAiCounting : startAiCounting}
              disabled={aiLoading}
              className="btn-main"
              style={{ marginTop: 12 }}
            >
              {aiLoading ? "Starting AI..." : aiRunning ? "Stop AI Counting" : "Start AI Counting"}
            </button>

            {!aiRunning && (
              <button
                onClick={loadCameras}
                type="button"
                className="btn-alt"
                style={{ marginTop: 10 }}
              >
                Refresh Camera List
              </button>
            )}

            {aiRunning && (
              <p className="qr-sub">
                AI is using: <strong>{selectedCamera?.label || "Selected device camera"}</strong>
              </p>
            )}
            {aiCount !== null && (
              <p className="qr-sub">
                AI Counted Students: <strong>{aiCount}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="action-stack" style={{ marginTop: 20 }}>
          <button
            onClick={() => navigate(`/teacher/attendance/${data.attendanceSlotId}`)}
            className="btn-alt"
          >
            Edit Manually
          </button>
          <button onClick={retake} className="btn-alt">
            Retake QR
          </button>
          <button onClick={save} disabled={saving} className="btn-main">
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
