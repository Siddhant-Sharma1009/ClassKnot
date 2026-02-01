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

/**
 * ONE STUDENT → ONE SUBMISSION → PER SESSION
 */
qrSubmissionSchema.index(
  { qrSessionId: 1, studentId: 1 },
  { unique: true, name: "unique_student_per_session" }
);

const QRSubmission = mongoose.model("QRSubmission", qrSubmissionSchema);

// FORCE index creation at startup
QRSubmission.syncIndexes();

export default QRSubmission;
