import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../styles/teacherExperience.css";

export default function StudentProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get("/student/me")
      .then((res) => setProfile(res.data))
      .catch(() => setProfile({}))
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      return setError("All fields are required");
    }

    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match");
    }

    setLoading(true);
    try {
      const res = await api.put("/student/change-password", {
        oldPassword,
        newPassword
      });

      setSuccess(res.data.message || "Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loadingProfile) {
    return (
      <div className="teacher-shell">
        <div className="teacher-wrap" style={{ maxWidth: 760 }}>
          <div className="teacher-panel">
            <p className="teacher-sub">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-shell">
      <div className="teacher-wrap" style={{ maxWidth: 760 }}>
        <div className="teacher-panel">
          <h1 className="teacher-title">Student Profile</h1>
          <p className="teacher-sub">Only password change is allowed from this section.</p>

          <div className="teacher-panel" style={{ marginTop: 14 }}>
            <p className="text-sm"><span className="font-semibold">Name:</span> {profile?.name || "-"}</p>
            <p className="text-sm mt-1"><span className="font-semibold">College ID:</span> {profile?.collegeId || "-"}</p>
            <p className="text-sm mt-1"><span className="font-semibold">Branch:</span> {profile?.branch || "-"}</p>
            <p className="text-sm mt-1"><span className="font-semibold">Semester:</span> {profile?.semester ?? "-"}</p>
          </div>

          <div className="teacher-panel" style={{ marginTop: 14 }}>
            <h2 className="text-xl font-semibold">Change Password</h2>

            <div className="teacher-grid" style={{ marginTop: 12 }}>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old password"
                className="input-field"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="input-field"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input-field"
              />
            </div>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            {success && <p className="text-sm text-green-600 mt-3">{success}</p>}

            <div className="teacher-actions">
              <button onClick={handleChangePassword} disabled={loading} className="btn-primary">
                {loading ? "Updating..." : "Update Password"}
              </button>
              <button onClick={() => navigate("/student")} className="btn-ghost">Back</button>
              <button onClick={logout} className="btn-ghost">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
