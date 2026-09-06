import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["doctor", "receptionist", "admin"], required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

export const User = mongoose.model("User", userSchema);
