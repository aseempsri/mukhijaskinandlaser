import { Appointment } from "../models/Appointment.js";
import { DoctorAvailability } from "../models/DoctorAvailability.js";
import { DoctorScheduleException } from "../models/DoctorScheduleException.js";
import {
  dayOfWeekUtc,
  formatDateOnly,
  isPastDateTime,
  parseDateOnly,
  timeToMinutes,
} from "../utils/time.js";

export async function getAvailableSlots({ doctorId, date, durationMinutes = 30 }) {
  const appointmentDate = parseDateOnly(date);
  const dow = dayOfWeekUtc(appointmentDate);

  const exception = await DoctorScheduleException.findOne({
    doctorId,
    date: appointmentDate,
  });
  if (exception?.isClosed) return [];

  let windows = [];
  if (exception && !exception.isClosed && exception.openStartTime && exception.openEndTime) {
    windows = [{ startTime: exception.openStartTime, endTime: exception.openEndTime, slotMinutes: durationMinutes }];
  } else {
    windows = await DoctorAvailability.find({ doctorId, dayOfWeek: dow, isActive: true });
  }

  const booked = await Appointment.find({
    doctorId,
    appointmentDate,
    status: { $in: ["PENDING", "APPROVED", "RESCHEDULE_REQUESTED"] },
  }).select("startTime endTime");

  const taken = booked.map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  const slots = [];
  for (const window of windows) {
    const slotSize = window.slotMinutes || durationMinutes;
    let cursor = timeToMinutes(window.startTime);
    const end = timeToMinutes(window.endTime);
    while (cursor + durationMinutes <= end) {
      const startLabel = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
      const endLabel = `${String(Math.floor((cursor + durationMinutes) / 60)).padStart(2, "0")}:${String((cursor + durationMinutes) % 60).padStart(2, "0")}`;
      const overlaps = taken.some((t) => cursor < t.end && cursor + durationMinutes > t.start);
      const past = isPastDateTime(appointmentDate, startLabel);
      if (!overlaps && !past) {
        slots.push({ startTime: startLabel, endTime: endLabel });
      }
      cursor += slotSize;
    }
  }
  return slots;
}

export async function assertSlotAvailable({ doctorId, date, startTime, endTime }) {
  const appointmentDate = parseDateOnly(date);
  if (isPastDateTime(appointmentDate, startTime)) {
    const error = new Error("Cannot book a time in the past.");
    error.status = 400;
    throw error;
  }

  const slots = await getAvailableSlots({
    doctorId,
    date: formatDateOnly(appointmentDate),
    durationMinutes: timeToMinutes(endTime) - timeToMinutes(startTime),
  });
  const ok = slots.some((s) => s.startTime === startTime && s.endTime === endTime);
  if (!ok) {
    const error = new Error("Selected time slot is not available.");
    error.status = 409;
    throw error;
  }
}
