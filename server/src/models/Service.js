import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    durationMinutes: { type: Number, required: true, default: 30 },
    price: { type: Number, default: null },
    currency: { type: String, default: "INR" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Service = mongoose.model("Service", serviceSchema);
