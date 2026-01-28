import mongoose from "mongoose";
import dotenv from "dotenv";
import Subject from "../models/Subject.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI,{dbName:"attendance"});

// HARD RESET
await Subject.deleteMany();

/* ===================== SUBJECT DATA ===================== */
const subjects = [

/* ================= CSE ================= */
{ code: "CS101", name: "Programming in C", branch: "CSE", semester: 1 },
{ code: "CS102", name: "Data Structures", branch: "CSE", semester: 2 },
{ code: "CS201", name: "OOP with Java", branch: "CSE", semester: 3 },
{ code: "CS202", name: "DBMS", branch: "CSE", semester: 3 },
{ code: "CS203", name: "Operating Systems", branch: "CSE", semester: 3 },
{ code: "CS301", name: "Computer Networks", branch: "CSE", semester: 4 },
{ code: "CS302", name: "Software Engineering", branch: "CSE", semester: 4 },
{ code: "CS401", name: "Compiler Design", branch: "CSE", semester: 5 },
{ code: "CS402", name: "Artificial Intelligence", branch: "CSE", semester: 5 },
{ code: "CS501", name: "Machine Learning", branch: "CSE", semester: 6 },
{ code: "CS502", name: "Cloud Computing", branch: "CSE", semester: 6 },
{ code: "CS601", name: "Big Data Analytics", branch: "CSE", semester: 7 },
{ code: "CS602", name: "Cyber Security", branch: "CSE", semester: 7 },
{ code: "CS701", name: "Blockchain", branch: "CSE", semester: 8 },

/* ================= EEE ================= */
{ code: "EE101", name: "Basic Electrical Engineering", branch: "EEE", semester: 1 },
{ code: "EE102", name: "Circuit Theory", branch: "EEE", semester: 2 },
{ code: "EE201", name: "Electrical Machines I", branch: "EEE", semester: 3 },
{ code: "EE202", name: "Signals and Systems", branch: "EEE", semester: 3 },
{ code: "EE301", name: "Power Systems", branch: "EEE", semester: 4 },
{ code: "EE302", name: "Control Systems", branch: "EEE", semester: 4 },
{ code: "EE401", name: "Power Electronics", branch: "EEE", semester: 5 },
{ code: "EE402", name: "Digital Signal Processing", branch: "EEE", semester: 5 },
{ code: "EE501", name: "Smart Grid", branch: "EEE", semester: 6 },
{ code: "EE502", name: "Renewable Energy Systems", branch: "EEE", semester: 6 },
{ code: "EE601", name: "High Voltage Engineering", branch: "EEE", semester: 7 },
{ code: "EE701", name: "Electric Vehicle Technology", branch: "EEE", semester: 8 },

/* ================= ME ================= */
{ code: "ME101", name: "Engineering Mechanics", branch: "ME", semester: 1 },
{ code: "ME102", name: "Thermodynamics", branch: "ME", semester: 2 },
{ code: "ME201", name: "Strength of Materials", branch: "ME", semester: 3 },
{ code: "ME202", name: "Manufacturing Processes", branch: "ME", semester: 3 },
{ code: "ME301", name: "Fluid Mechanics", branch: "ME", semester: 4 },
{ code: "ME302", name: "Heat Transfer", branch: "ME", semester: 4 },
{ code: "ME401", name: "Machine Design", branch: "ME", semester: 5 },
{ code: "ME402", name: "Dynamics of Machines", branch: "ME", semester: 5 },
{ code: "ME501", name: "CAD/CAM", branch: "ME", semester: 6 },
{ code: "ME502", name: "Robotics", branch: "ME", semester: 6 },
{ code: "ME601", name: "Automobile Engineering", branch: "ME", semester: 7 },
{ code: "ME701", name: "Industrial Engineering", branch: "ME", semester: 8 },

/* ================= CE ================= */
{ code: "CE101", name: "Engineering Mathematics", branch: "CE", semester: 1 },
{ code: "CE102", name: "Building Materials", branch: "CE", semester: 2 },
{ code: "CE201", name: "Structural Analysis I", branch: "CE", semester: 3 },
{ code: "CE202", name: "Surveying", branch: "CE", semester: 3 },
{ code: "CE301", name: "Geotechnical Engineering", branch: "CE", semester: 4 },
{ code: "CE302", name: "Concrete Technology", branch: "CE", semester: 4 },
{ code: "CE401", name: "Transportation Engineering", branch: "CE", semester: 5 },
{ code: "CE402", name: "Environmental Engineering", branch: "CE", semester: 5 },
{ code: "CE501", name: "Irrigation Engineering", branch: "CE", semester: 6 },
{ code: "CE601", name: "Construction Planning", branch: "CE", semester: 7 },
{ code: "CE701", name: "Advanced Structural Design", branch: "CE", semester: 8 }

];

await Subject.insertMany(subjects);

console.log(`✅ Seeded ${subjects.length} subjects successfully`);
process.exit();
