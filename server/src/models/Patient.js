import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    age: { type: Number, default: null },
    gender: { type: String, default: null },
    whatsappOptIn: { type: Boolean, default: true },
    emailOptIn: { type: Boolean, default: true },
    lastAppointmentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

patientSchema.index({ phone: 1 });
patientSchema.index({ email: 1 });

export const Patient = mongoose.model("Patient", patientSchema);
