import mongoose from "mongoose";

export const APPOINTMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RESCHEDULE_REQUESTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
];

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: { type: String, required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    appointmentDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: "PENDING" },
    bookingSource: { type: String, enum: ["WEBSITE", "ADMIN"], default: "WEBSITE" },
    patientNotes: { type: String, default: null },
    doctorNotes: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    cancellationReason: { type: String, default: null },
    rescheduleReason: { type: String, default: null },
    publicToken: { type: String, required: true, unique: true },
    consentGiven: { type: Boolean, default: false },
    consentVersion: { type: String, default: "2026-01" },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevents two active bookings for the same doctor/date/start (race-safe).
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    name: "uniq_active_doctor_date_start",
    partialFilterExpression: {
      status: { $in: ["PENDING", "APPROVED", "RESCHEDULE_REQUESTED"] },
    },
  }
);
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, createdAt: -1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);
