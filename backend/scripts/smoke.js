import axios from "axios";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:5000/api";
const PASS = process.env.SMOKE_PASSWORD || "pass123";
const CREDS = {
  teacher: process.env.SMOKE_TEACHER_ID || "TCH71",
  student: process.env.SMOKE_STUDENT_ID || "24105110001",
  hod: process.env.SMOKE_HOD_ID || "HOD91"
};

const login = async (collegeId, password) => {
  const res = await axios.post(`${BASE_URL}/auth/login`, { collegeId, password });
  return res.data;
};

const authGet = async (path, token) => {
  const res = await axios.get(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

const run = async () => {
  const checks = [];

  const health = await axios.get(`${BASE_URL}/health`);
  checks.push(["health", health.data?.ok === true]);

  const version = await axios.get(`${BASE_URL}/version`);
  checks.push(["version", Boolean(version.data?.version)]);

  const teacher = await login(CREDS.teacher, PASS);
  checks.push(["login teacher", teacher.role === "TEACHER"]);
  await authGet("/teacher/me", teacher.token);
  checks.push(["teacher profile", true]);

  const student = await login(CREDS.student, PASS);
  checks.push(["login student", student.role === "STUDENT"]);
  await authGet("/student/me", student.token);
  checks.push(["student profile", true]);

  const hod = await login(CREDS.hod, PASS);
  checks.push(["login hod", hod.role === "HOD"]);
  await authGet("/hod/me", hod.token);
  checks.push(["hod profile", true]);

  const failed = checks.filter(([, ok]) => !ok);
  checks.forEach(([name, ok]) => {
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  });

  if (failed.length > 0) {
    process.exit(1);
  }
};

run().catch((err) => {
  const status = err?.response?.status;
  const message = err?.response?.data?.message || err.message;
  console.error(`SMOKE FAILED${status ? ` [HTTP ${status}]` : ""}: ${message}`);
  process.exit(1);
});
