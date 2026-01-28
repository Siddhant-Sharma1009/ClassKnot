import mongoose from "mongoose";

const qrSessionSchema = new mongoose.Schema(
    {
        attendanceSlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttendanceSlot",
            required: true
        },

        totalRows: {
            type: Number,
            required: true
        },

        currentRow: {
            type: Number,
            default: 1
        },

        isActive: {
            type: Boolean,
            default: true
        },
        currentToken: {
            type: String,
            default: null
        },

        tokenExpiresAt: {
            type: Number,
            default: null
        }

    },

    { timestamps: true }
);

export default mongoose.model("QRSession", qrSessionSchema);
