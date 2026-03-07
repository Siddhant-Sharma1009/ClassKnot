import mongoose from "mongoose";

const qrSessionSchema = new mongoose.Schema(
    {
        attendanceSlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttendanceSlot",
            required: true
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
        },

        previousToken: {
            type: String,
            default: null
        },

        previousTokenExpiresAt: {
            type: Number,
            default: null
        }

    },

    { timestamps: true }
);

export default mongoose.model("QRSession", qrSessionSchema);
