import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* AUTH */
import Login from "./pages/Login";
import ProtectedRoute from "./auth/ProtectedRoute";

/* TEACHER PAGES */
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateSession from "./pages/teacher/CreateSession";
import ClassDetails from "./pages/teacher/ClassDetails";
import ManualAttendance from "./pages/teacher/ManualAttendance";
import AttendanceSummary from "./pages/teacher/AttendanceSummary";
import TeacherProfile from "./pages/teacher/TeacherProfile";

/* QR – TEACHER */
import StartQR from "./pages/teacher/StartQR";
import LiveQR from "./pages/teacher/LiveQR";
import QRPreview from "./pages/teacher/QRPreview";

/* STUDENT PAGES */
import StudentDashboard from "./pages/student/StudentDashboard";
import ScanQR from "./pages/student/ScanQR";
import StudentProfile from "./pages/student/StudentProfile";

/* HOD PAGES */
import HodDashboard from "./pages/hod/hodDashboard";
import HodProfile from "./pages/hod/hodProfile";
import SubjectAttendance from "./pages/hod/SubjectAttendance";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= AUTH ================= */}
        <Route path="/" element={<Login />} />

        {/* ================= STUDENT ================= */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/scan"
          element={
            <ProtectedRoute role="STUDENT">
              <ScanQR />
            </ProtectedRoute>
          }
        />

        <Route path="/student/profile" element={<StudentProfile />} />


        {/* ================= TEACHER ================= */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="TEACHER">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/create"
          element={
            <ProtectedRoute role="TEACHER">
              <CreateSession />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/class/:classId"
          element={
            <ProtectedRoute role="TEACHER">
              <ClassDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance/:slotId"
          element={
            <ProtectedRoute role="TEACHER">
              <ManualAttendance />
            </ProtectedRoute>
          }
        />

        {/* ===== QR ATTENDANCE – TEACHER ===== */}
        <Route
          path="/teacher/qr/start/:slotId"
          element={
            <ProtectedRoute role="TEACHER">
              <StartQR />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/qr/live/:qrSessionId"
          element={
            <ProtectedRoute role="TEACHER">
              <LiveQR />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/qr/preview/:qrSessionId"
          element={
            <ProtectedRoute role="TEACHER">
              <QRPreview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance-summary/:classId"
          element={
            <ProtectedRoute role="TEACHER">
              <AttendanceSummary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute role="TEACHER">
              <TeacherProfile />
            </ProtectedRoute>
          }
        />

        {/* ================= HOD (FIXED) ================= */}

        {/* redirect /hod → /hod/dashboard */}
        <Route
          path="/hod"
          element={
            <ProtectedRoute role="HOD">
              <HodDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute role="HOD">
              <HodDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hod/profile"
          element={
            <ProtectedRoute allowedRoles={["HOD"]}>
              <HodProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/subject/:subjectId"
          element={
            <ProtectedRoute role="HOD">
              <SubjectAttendance />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
