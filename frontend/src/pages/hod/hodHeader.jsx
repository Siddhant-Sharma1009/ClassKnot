import { useNavigate } from "react-router-dom";

export default function HodHeader({ collegeId, role }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* =========================
           LEFT: TITLE + USER INFO
        ========================= */}
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            HOD Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            {role} · {collegeId}
          </p>
        </div>

        {/* =========================
           RIGHT: ACTIONS
        ========================= */}
        <div className="flex items-center gap-4">

          {/* 🔔 Placeholder */}
          <button
            className="relative text-gray-600 hover:text-gray-800 transition"
            title="Notifications (Coming Soon)"
          >
            🔔
          </button>

          {/* 👤 Profile */}
          <button
            onClick={() => navigate("/hod/profile")}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Profile
          </button>

          {/* 🚪 Logout */}
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

      </div>
    </header>
  );
}
