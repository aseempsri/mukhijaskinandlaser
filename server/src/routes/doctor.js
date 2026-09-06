import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Appointment } from "../models/Appointment.js";
import { AppointmentStatusHistory } from "../models/AppointmentStatusHistory.js";
import { DoctorAvailability } from "../models/DoctorAvailability.js";
import { DoctorScheduleException } from "../models/DoctorScheduleException.js";
import { Notification } from "../models/Notification.js";
import { Patient } from "../models/Patient.js";
import { PatientImage } from "../models/PatientImage.js";
import { PatientQuestionnaire } from "../models/PatientQuestionnaire.js";
import { NotificationService } from "../services/notifications.js";
import { addMinutesToTime, formatDateOnly, parseDateOnly } from "../utils/time.js";

const router = Router();
router.use(requireAuth, requireRole("doctor", "admin", "receptionist"));

function resolveActiveDoctorId(req) {
  const headerId = req.headers["x-doctor-id"];
  const queryId = req.query.doctorId;
  const bodyId = req.body?.doctorId;
  if (req.user.role === "doctor" && req.user.doctorId) {
    return String(req.user.doctorId);
  }
  const selected = headerId || queryId || bodyId;
  return selected ? String(selected) : null;
}

function doctorScope(req) {
  const doctorId = resolveActiveDoctorId(req);
  if (!doctorId) {
    const error = new Error("Select a doctor to continue.");
    error.status = 400;
    throw error;
  }
  return { doctorId };
}

function assertDoctorAccess(req, doctorId) {
  if (req.user.role === "doctor" && req.user.doctorId && String(req.user.doctorId) !== String(doctorId)) {
    const error = new Error("Forbidden.");
    error.status = 403;
    throw error;
  }
}

async function loadOwnedAppointment(req, id) {
  const filter = { _id: id, ...doctorScope(req) };
  const appointment = await Appointment.findOne(filter)
    .populate("patientId")
    .populate("doctorId")
    .populate("serviceId");
  if (!appointment) {
    const error = new Error("Appointment not found.");
    error.status = 404;
    throw error;
  }
  return appointment;
}

router.get("/appointments", async (req, res, next) => {
  try {
    const filter = { ...doctorScope(req) };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.appointmentDate = parseDateOnly(req.query.date);
    const appointments = await Appointment.find(filter)
      .populate("patientId", "fullName phone email")
      .populate("serviceId", "name durationMinutes")
      .populate("doctorId", "name title")
      .sort({ appointmentDate: 1, startTime: 1 });
    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/pending", async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ ...doctorScope(req), status: "PENDING" })
      .populate("patientId", "fullName phone email")
      .populate("serviceId", "name")
      .populate("doctorId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/today", async (req, res, next) => {
  try {
    const today = new Date();
    const y = today.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" });
    const m = today.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", month: "2-digit" });
    const d = today.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", day: "2-digit" });
    const date = parseDateOnly(`${y}-${m}-${d}`);
    const appointments = await Appointment.find({
      ...doctorScope(req),
      appointmentDate: date,
      status: { $in: ["APPROVED", "PENDING"] },
    })
      .populate("patientId", "fullName phone")
      .populate("serviceId", "name")
      .sort({ startTime: 1 });
    res.json({ success: true, date: formatDateOnly(date), appointments });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/:id", async (req, res, next) => {
  try {
    const appointment = await loadOwnedAppointment(req, req.params.id);
    const [questionnaire, images, history, notifications] = await Promise.all([
      PatientQuestionnaire.findOne({ appointmentId: appointment._id }),
      PatientImage.find({ appointmentId: appointment._id }),
      AppointmentStatusHistory.find({ appointmentId: appointment._id }).sort({ createdAt: 1 }),
      Notification.find({ appointmentId: appointment._id }).sort({ createdAt: -1 }),
    ]);
    res.json({ success: true, appointment, questionnaire, images, history, notifications });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/:id/approve", async (req, res, next) => {
  try {
    const appointment = await loadOwnedAppointment(req, req.params.id);
    if (appointment.status !== "PENDING" && appointment.status !== "RESCHEDULE_REQUESTED") {
      const error = new Error(`Cannot approve from status ${appointment.status}.`);
      error.status = 409;
      throw error;
    }
    const fromStatus = appointment.status;
    appointment.status = "APPROVED";
    appointment.approvedAt = new Date();
    appointment.doctorNotes = req.body.doctorNotes || appointment.doctorNotes;
    await appointment.save();
    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "APPROVED",
      changedByUserId: req.user._id,
      note: req.body.doctorNotes || null,
    });
    await NotificationService.sendAppointmentApproved({
      appointment,
      patient: appointment.patientId,
      doctor: appointment.doctorId,
      service: appointment.serviceId,
    });
    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/:id/reject", async (req, res, next) => {
  try {
    const appointment = await loadOwnedAppointment(req, req.params.id);
    if (appointment.status !== "PENDING" && appointment.status !== "RESCHEDULE_REQUESTED") {
      const error = new Error(`Cannot reject from status ${appointment.status}.`);
      error.status = 409;
      throw error;
    }
    const reason = req.body.reason || null;
    const fromStatus = appointment.status;
    appointment.status = "REJECTED";
    appointment.rejectedAt = new Date();
    appointment.rejectionReason = reason;
    await appointment.save();
    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "REJECTED",
      changedByUserId: req.user._id,
      note: reason,
    });
    await NotificationService.sendAppointmentRejected({
      appointment,
      patient: appointment.patientId,
      reason,
    });
    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/:id/reschedule", async (req, res, next) => {
  try {
    const schema = z.object({
      proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      proposedStartTime: z.string().regex(/^\d{2}:\d{2}$/),
      reason: z.string().optional(),
    });
    const body = schema.parse(req.body);
    const appointment = await loadOwnedAppointment(req, req.params.id);
    const fromStatus = appointment.status;
    appointment.status = "RESCHEDULE_REQUESTED";
    appointment.rescheduleReason = body.reason || null;
    appointment.appointmentDate = parseDateOnly(body.proposedDate);
    appointment.startTime = body.proposedStartTime;
    const duration = appointment.serviceId.durationMinutes || 30;
    appointment.endTime = addMinutesToTime(body.proposedStartTime, duration);
    await appointment.save();
    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "RESCHEDULE_REQUESTED",
      changedByUserId: req.user._id,
      note: body.reason || `Proposed ${body.proposedDate} ${body.proposedStartTime}`,
    });
    await NotificationService.sendAppointmentRescheduled({
      appointment,
      patient: appointment.patientId,
      proposedDate: body.proposedDate,
      proposedTime: body.proposedStartTime,
      reason: body.reason,
    });
    res.json({ success: true, appointment });
  } catch (error) {
    if (error.name === "ZodError") {
      error.status = 400;
      error.message = "Invalid reschedule payload.";
      error.details = error.errors;
    }
    next(error);
  }
});

router.post("/appointments/:id/complete", async (req, res, next) => {
  try {
    const appointment = await loadOwnedAppointment(req, req.params.id);
    const fromStatus = appointment.status;
    appointment.status = "COMPLETED";
    appointment.completedAt = new Date();
    if (req.body.doctorNotes) appointment.doctorNotes = req.body.doctorNotes;
    await appointment.save();
    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "COMPLETED",
      changedByUserId: req.user._id,
    });
    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/:id/no-show", async (req, res, next) => {
  try {
    const appointment = await loadOwnedAppointment(req, req.params.id);
    const fromStatus = appointment.status;
    appointment.status = "NO_SHOW";
    await appointment.save();
    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "NO_SHOW",
      changedByUserId: req.user._id,
    });
    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
});

router.get("/patients/:id", async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    const appointments = await Appointment.find({ patientId: patient._id, ...doctorScope(req) })
      .populate("serviceId", "name")
      .sort({ appointmentDate: -1 });
    res.json({ success: true, patient, appointments });
  } catch (error) {
    next(error);
  }
});

router.get("/availability", async (req, res, next) => {
  try {
    const doctorId = resolveActiveDoctorId(req);
    if (!doctorId) return res.status(400).json({ success: false, message: "Select a doctor to continue." });
    assertDoctorAccess(req, doctorId);
    const availability = await DoctorAvailability.find({ doctorId }).sort({ dayOfWeek: 1, startTime: 1 });
    const exceptions = await DoctorScheduleException.find({ doctorId }).sort({ date: 1 });
    res.json({ success: true, availability, exceptions });
  } catch (error) {
    next(error);
  }
});

router.post("/availability", async (req, res, next) => {
  try {
    const schema = z.object({
      doctorId: z.string().optional(),
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      slotMinutes: z.number().int().min(10).max(120).optional(),
    });
    const body = schema.parse(req.body);
    const doctorId = resolveActiveDoctorId(req) || body.doctorId;
    if (!doctorId) return res.status(400).json({ success: false, message: "Select a doctor to continue." });
    assertDoctorAccess(req, doctorId);
    const doc = await DoctorAvailability.create({
      doctorId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      slotMinutes: body.slotMinutes || 30,
      isActive: true,
    });
    res.status(201).json({ success: true, availability: doc });
  } catch (error) {
    if (error.name === "ZodError") {
      error.status = 400;
      error.message = "Invalid availability payload.";
      error.details = error.errors;
    }
    next(error);
  }
});

router.patch("/availability/:id", async (req, res, next) => {
  try {
    const doc = await DoctorAvailability.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found." });
    assertDoctorAccess(req, doc.doctorId);
    const activeDoctorId = resolveActiveDoctorId(req);
    if (activeDoctorId && String(doc.doctorId) !== String(activeDoctorId)) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }
    ["startTime", "endTime", "slotMinutes", "isActive", "dayOfWeek"].forEach((key) => {
      if (req.body[key] !== undefined) doc[key] = req.body[key];
    });
    await doc.save();
    res.json({ success: true, availability: doc });
  } catch (error) {
    next(error);
  }
});

router.get("/images/:id", async (req, res, next) => {
  try {
    const image = await PatientImage.findById(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: "Image not found." });
    const appointment = await Appointment.findById(image.appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });
    assertDoctorAccess(req, appointment.doctorId);
    const activeDoctorId = resolveActiveDoctorId(req);
    if (activeDoctorId && String(appointment.doctorId) !== String(activeDoctorId)) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }
    if (!fs.existsSync(image.storagePath)) {
      return res.status(404).json({ success: false, message: "File missing on disk." });
    }
    res.type(image.mimeType);
    res.sendFile(path.resolve(image.storagePath));
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const doctorId = resolveActiveDoctorId(req);
    const filter = { recipientType: "doctor", channel: "dashboard" };
    if (doctorId) filter.recipientId = doctorId;
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
});
router.get("/dashboard/summary", async (req, res, next) => {
  try {
    const scope = doctorScope(req);
    const [pending, approvedUpcoming, today] = await Promise.all([
      Appointment.countDocuments({ ...scope, status: "PENDING" }),
      Appointment.countDocuments({
        ...scope,
        status: "APPROVED",
        appointmentDate: { $gte: parseDateOnly(new Date().toISOString().slice(0, 10)) },
      }),
      Appointment.find({
        ...scope,
        appointmentDate: parseDateOnly(
          new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 10)
        ),
        status: { $in: ["APPROVED", "PENDING"] },
      })
        .populate("patientId", "fullName phone")
        .populate("serviceId", "name")
        .sort({ startTime: 1 }),
    ]);
    const recentPending = await Appointment.find({ ...scope, status: "PENDING" })
      .populate("patientId", "fullName phone")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({ success: true, summary: { pending, approvedUpcoming, todayCount: today.length }, today, recentPending });
  } catch (error) {
    next(error);
  }
});

export default router;
