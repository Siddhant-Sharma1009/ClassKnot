import mongoose from "mongoose";

const qrSubmissionSchema = new mongoose.Schema(
  {
    qrSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRSession",
      required: true
    },

    attendanceSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSlot",
      required: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    rowNumber: {
      type: Number,
      required: true
    },

    qrToken: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

/* Prevent duplicate submission in a session*/
qrSubmissionSchema.index(
  { qrSessionId: 1, studentId: 1},
  { unique: true }
);

export default mongoose.model("QRSubmission", qrSubmissionSchema);
