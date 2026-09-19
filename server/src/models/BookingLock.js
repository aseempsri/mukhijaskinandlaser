import mongoose from "mongoose";

const bookingLockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

bookingLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BookingLock = mongoose.model("BookingLock", bookingLockSchema);
