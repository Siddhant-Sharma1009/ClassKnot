import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/student/me")
      .then(res => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async () => {
    setMessage("");
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      return setError("All fields are required");
    }

    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match");
    }

    try {
      const res = await api.put("/student/change-password", {
        oldPassword,
        newPassword
      });

      setMessage(res.data.message || "Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            👤 Student Profile
          </h1>

          <button
            onClick={() => navigate(-1)}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back
          </button>
        </div>

        {/* PROFILE INFO */}
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Name:</span> {profile.name}</p>
          <p><span className="font-medium">Branch:</span> {profile.branch}</p>
          <p><span className="font-medium">Semester:</span> {profile.semester}</p>
          {profile.section && (
            <p><span className="font-medium">Section:</span> {profile.section}</p>
          )}
          {profile.group && (
            <p><span className="font-medium">Group:</span> {profile.group}</p>
          )}
        </div>

        {/* CHANGE PASSWORD */}
        <div className="border-t pt-4 space-y-3">
          <h2 className="text-lg font-medium text-gray-800">
            Change Password
          </h2>

          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            onClick={handleChangePassword}
            className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Update Password
          </button>
        </div>

      </div>
    </div>
  );
}
