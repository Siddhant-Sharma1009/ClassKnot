import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  code: { type: String, unique: true },   // e.g. CS301
  name: { type: String },                 // DBMS
  branch: { type: String },
  semester: { type: Number }
});

export default mongoose.model("Subject", subjectSchema);
