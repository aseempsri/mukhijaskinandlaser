import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    changedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

historySchema.index({ appointmentId: 1, createdAt: -1 });

export const AppointmentStatusHistory = mongoose.model("AppointmentStatusHistory", historySchema);
