import { BookingLock } from "../models/BookingLock.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lockIdFor(doctorId, date) {
  return `doctor:${String(doctorId)}:date:${String(date)}`;
}

/**
 * Serializes booking mutations for one doctor + calendar day so overlap
 * checks and writes cannot interleave.
 */
export async function withDoctorDateLock(doctorId, date, fn, { ttlMs = 10000, maxAttempts = 12 } = {}) {
  const lockId = lockIdFor(doctorId, date);
  let acquired = false;

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMs);

      const stale = await BookingLock.findOne({ _id: lockId, expiresAt: { $lte: now } });
      if (stale) {
        await BookingLock.deleteOne({ _id: lockId, expiresAt: stale.expiresAt });
      }

      try {
        await BookingLock.create({ _id: lockId, expiresAt });
        acquired = true;
        break;
      } catch (error) {
        if (error?.code !== 11000) throw error;
        await sleep(40 + attempt * 35);
      }
    }

    if (!acquired) {
      const error = new Error("This time slot is busy. Please try again in a moment.");
      error.status = 409;
      throw error;
    }

    return await fn();
  } finally {
    if (acquired) {
      await BookingLock.deleteOne({ _id: lockId }).catch(() => {});
    }
  }
}

export function isDuplicateKeyError(error) {
  return Boolean(error && (error.code === 11000 || error.codeName === "DuplicateKey"));
}

export function slotConflictError(message = "Selected time slot is not available.") {
  const error = new Error(message);
  error.status = 409;
  return error;
}
