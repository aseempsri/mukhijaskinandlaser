import mongoose from "mongoose";

const exceptionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: Date, required: true },
    isClosed: { type: Boolean, default: true },
    reason: { type: String, default: null },
    openStartTime: { type: String, default: null },
    openEndTime: { type: String, default: null },
  },
  { timestamps: true }
);

exceptionSchema.index({ doctorId: 1, date: 1 });

export const DoctorScheduleException = mongoose.model("DoctorScheduleException", exceptionSchema);
