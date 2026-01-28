import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {


  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    
    if (!collegeId || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { collegeId, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "STUDENT") navigate("/student");
      if (res.data.role === "TEACHER") navigate("/teacher");
      if (res.data.role === "HOD") navigate("/hod");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <div className="
  min-h-screen
  bg-gradient-to-br from-indigo-500 to-purple-600
  flex flex-col items-center justify-center
  font-sans
  p-5
  relative overflow-hidden
">
  {/* Background decoration */}
  <div className="
    fixed -top-1/2 -right-[10%]
    w-[500px] h-[500px]
    bg-white/10 rounded-full
    pointer-events-none
  " />

  <div className="
    fixed -bottom-[30%] -left-[10%]
    w-[400px] h-[400px]
    bg-white/10 rounded-full
    pointer-events-none
  " />

  {/* Login Box */}
  <div className="
    bg-white
    p-10
    rounded-2xl
    shadow-[0_20px_60px_rgba(0,0,0,0.3)]
    w-full max-w-[420px]
    relative z-10
  ">
    {/* Logo and Brand */}
    <div className="text-center mb-10">
      <div className="
        text-5xl font-extrabold
        bg-gradient-to-br from-indigo-500 to-purple-600
        bg-clip-text text-transparent
        tracking-wide mb-2
      ">
        🎓 ClassKnot
      </div>

      <p className="text-gray-400 text-sm tracking-wide">
        Smart Attendance Management System
      </p>
    </div>

    {/* Heading */}
    <h2 className="
      text-2xl font-semibold
      text-gray-800 text-center mb-2
    ">
      Welcome Back
    </h2>

    <p className="text-center text-gray-400 text-sm mb-8">
      Sign in to your account to continue
    </p>

    {/* Error Message */}
    {error && (
      <div className="
        mb-5
        px-4 py-3
        bg-red-50
        border border-red-200
        rounded-lg
        text-red-700
        text-sm text-center
      ">
        {error}
      </div>
    )}

    {/* Form */}
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        login();
      }}
    >
      {/* College ID */}
      <div>
        <label className="
          block mb-2
          text-sm font-medium text-gray-700
        ">
          College ID
        </label>

        <input
          type="text"
          placeholder="Enter your college ID"
          value={collegeId}
          onChange={(e) => setCollegeId(e.target.value)}
          onKeyPress={handleKeyPress}
          className="
            w-full
            px-4 py-3
            border-2 border-gray-200
            rounded-lg
            text-sm
            outline-none
            transition
            focus:border-indigo-500
            focus:ring-4 focus:ring-indigo-500/10
          "
        />
      </div>

      {/* Password */}
      <div>
        <label className="
          block mb-2
          text-sm font-medium text-gray-700
        ">
          Password
        </label>

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="
            w-full
            px-4 py-3
            border-2 border-gray-200
            rounded-lg
            text-sm
            outline-none
            transition
            focus:border-indigo-500
            focus:ring-4 focus:ring-indigo-500/10
          "
        />
      </div>

      {/* Submit Button (example – keep your logic if exists) */}
      <button
        type="submit"
        className="
          mt-4
          py-3
          bg-gradient-to-r from-indigo-500 to-purple-600
          text-white
          font-semibold
          rounded-lg
          hover:opacity-90
          active:scale-[0.98]
          transition
        "
      >
        Sign In
      </button>
    </form>
  </div>
</div>

  );
}
