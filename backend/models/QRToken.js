// models/QRToken.js
import mongoose from "mongoose";

const qrTokenSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  row: { type: Number, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Number, required: true },
  used: { type: Boolean, default: false }
});

export default mongoose.model("QRToken", qrTokenSchema);
