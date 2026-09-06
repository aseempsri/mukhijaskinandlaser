import crypto from "node:crypto";

export function createAppointmentNumber(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `MKH-${y}${m}${d}-${suffix}`;
}

export function createPublicToken() {
  return crypto.randomBytes(24).toString("hex");
}

/** "HH:MM" -> minutes since midnight */
export function timeToMinutes(time) {
  const [h, m] = String(time).split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutesToTime(time, minutes) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function parseDateOnly(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateOnly(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayOfWeekUtc(date) {
  return date.getUTCDay();
}

export function isPastDateTime(dateOnly, startTime, now = new Date()) {
  const [y, m, d] = formatDateOnly(dateOnly).split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  // Treat clinic local as IST (UTC+5:30)
  const slotUtc = Date.UTC(y, m - 1, d, hh - 5, mm - 30);
  return slotUtc <= now.getTime();
}
