import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotMinutes: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });

export const DoctorAvailability = mongoose.model("DoctorAvailability", availabilitySchema);
