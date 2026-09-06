import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    profileImage: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    timezone: { type: String, default: "Asia/Kolkata" },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);
