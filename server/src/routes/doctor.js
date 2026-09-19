import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
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
import { Staff } from "../models/Staff.js";
import { assertSlotAvailable } from "../services/availability.js";
import { isDuplicateKeyError, slotConflictError, withDoctorDateLock } from "../services/bookingLock.js";
import { appointmentCalendarPayload } from "../services/calendar.js";
import { NotificationService, notifyInBackground } from "../services/notifications.js";
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
      .sort({ createdAt: -1 });
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

    const dateKey = formatDateOnly(appointment.appointmentDate);
    const doctorId = String(appointment.doctorId._id);

    await withDoctorDateLock(doctorId, dateKey, async () => {
      await assertSlotAvailable({
        doctorId,
        date: dateKey,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        excludeAppointmentId: appointment._id,
      });

      const fromStatus = appointment.status;
      appointment.status = "APPROVED";
      appointment.approvedAt = new Date();
      appointment.doctorNotes = req.body.doctorNotes || appointment.doctorNotes;
      try {
        await appointment.save();
      } catch (error) {
        if (isDuplicateKeyError(error)) throw slotConflictError();
        throw error;
      }
      await AppointmentStatusHistory.create({
        appointmentId: appointment._id,
        fromStatus,
        toStatus: "APPROVED",
        changedByUserId: req.user._id,
        note: req.body.doctorNotes || null,
      });
    });

    notifyInBackground(() =>
      NotificationService.sendAppointmentApproved({
        appointment,
        patient: appointment.patientId,
        doctor: appointment.doctorId,
        service: appointment.serviceId,
      })
    );
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
    notifyInBackground(() =>
      NotificationService.sendAppointmentRejected({
        appointment,
        patient: appointment.patientId,
        service: appointment.serviceId,
        reason,
      })
    );
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
    if (
      appointment.status === "CANCELLED" ||
      appointment.status === "COMPLETED" ||
      appointment.status === "REJECTED" ||
      appointment.status === "NO_SHOW"
    ) {
      const error = new Error(`Cannot reschedule from status ${appointment.status}.`);
      error.status = 409;
      throw error;
    }

    const duration = appointment.serviceId.durationMinutes || 30;
    const proposedEndTime = addMinutesToTime(body.proposedStartTime, duration);
    const doctorId = String(appointment.doctorId._id);
    const oldDateKey = formatDateOnly(appointment.appointmentDate);

    // Lock both old and new days when they differ (order locks to avoid deadlocks).
    const datesToLock = [...new Set([oldDateKey, body.proposedDate])].sort();
    const runReschedule = async () => {
      await assertSlotAvailable({
        doctorId,
        date: body.proposedDate,
        startTime: body.proposedStartTime,
        endTime: proposedEndTime,
        excludeAppointmentId: appointment._id,
      });

      const fromStatus = appointment.status;
      appointment.status = "RESCHEDULE_REQUESTED";
      appointment.rescheduleReason = body.reason || null;
      appointment.appointmentDate = parseDateOnly(body.proposedDate);
      appointment.startTime = body.proposedStartTime;
      appointment.endTime = proposedEndTime;
      try {
        await appointment.save();
      } catch (error) {
        if (isDuplicateKeyError(error)) throw slotConflictError();
        throw error;
      }
      await AppointmentStatusHistory.create({
        appointmentId: appointment._id,
        fromStatus,
        toStatus: "RESCHEDULE_REQUESTED",
        changedByUserId: req.user._id,
        note: body.reason || `Proposed ${body.proposedDate} ${body.proposedStartTime}`,
      });
    };

    if (datesToLock.length === 1) {
      await withDoctorDateLock(doctorId, datesToLock[0], runReschedule);
    } else {
      await withDoctorDateLock(doctorId, datesToLock[0], () =>
        withDoctorDateLock(doctorId, datesToLock[1], runReschedule)
      );
    }

    notifyInBackground(() =>
      NotificationService.sendAppointmentRescheduled({
        appointment,
        patient: appointment.patientId,
        proposedDate: body.proposedDate,
        proposedTime: body.proposedStartTime,
        reason: body.reason,
      })
    );
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

router.post("/appointments/:id/cancel", async (req, res, next) => {
  try {
    const appointment = await loadOwnedAppointment(req, req.params.id);
    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
      const error = new Error(`Cannot cancel appointment with status ${appointment.status}.`);
      error.status = 409;
      throw error;
    }
    const reason = req.body.reason || null;
    const fromStatus = appointment.status;
    appointment.status = "CANCELLED";
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;
    await appointment.save();
    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "CANCELLED",
      changedByUserId: req.user._id,
      note: reason,
    });
    await NotificationService.sendAppointmentCancelled({
      appointment,
      patient: appointment.patientId,
      doctor: appointment.doctorId,
      reason,
      cancelledBy: "doctor",
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

router.get("/staff", async (_req, res, next) => {
  try {
    const staff = await Staff.find({}).sort({ name: 1 });
    res.json({ success: true, staff });
  } catch (error) {
    next(error);
  }
});

router.post("/staff", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(120),
      phone: z.string().min(8).max(20),
      receiveNewAppointmentWhatsApp: z.boolean().optional().default(true),
    });
    const body = schema.parse(req.body);
    const phone = body.phone.replace(/\s+/g, "").trim();
    const existing = await Staff.findOne({ phone });
    if (existing) {
      const error = new Error("A staff member with this phone number already exists.");
      error.status = 409;
      throw error;
    }
    const staff = await Staff.create({
      name: body.name.trim(),
      phone,
      receiveNewAppointmentWhatsApp: body.receiveNewAppointmentWhatsApp ?? true,
      isActive: true,
    });
    res.status(201).json({ success: true, staff });
  } catch (error) {
    if (error.name === "ZodError") {
      error.status = 400;
      error.message = "Invalid staff payload.";
      error.details = error.errors;
    }
    next(error);
  }
});

router.patch("/staff/:id", async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found." });
    const schema = z.object({
      name: z.string().min(2).max(120).optional(),
      phone: z.string().min(8).max(20).optional(),
      receiveNewAppointmentWhatsApp: z.boolean().optional(),
      isActive: z.boolean().optional(),
    });
    const body = schema.parse(req.body);
    if (body.name !== undefined) staff.name = body.name.trim();
    if (body.phone !== undefined) {
      const phone = body.phone.replace(/\s+/g, "").trim();
      const clash = await Staff.findOne({ phone, _id: { $ne: staff._id } });
      if (clash) {
        const error = new Error("A staff member with this phone number already exists.");
        error.status = 409;
        throw error;
      }
      staff.phone = phone;
    }
    if (body.receiveNewAppointmentWhatsApp !== undefined) {
      staff.receiveNewAppointmentWhatsApp = body.receiveNewAppointmentWhatsApp;
    }
    if (body.isActive !== undefined) staff.isActive = body.isActive;
    await staff.save();
    res.json({ success: true, staff });
  } catch (error) {
    if (error.name === "ZodError") {
      error.status = 400;
      error.message = "Invalid staff update.";
      error.details = error.errors;
    }
    next(error);
  }
});

router.delete("/staff/:id", async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found." });
    res.json({ success: true, message: "Staff member removed." });
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

router.get("/analytics", async (req, res, next) => {
  try {
    const scope = doctorScope(req);
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const match = {
      doctorId: new mongoose.Types.ObjectId(String(scope.doctorId)),
      createdAt: { $gte: since },
    };
    const [byStatus, byDay, byService, totals] = await Promise.all([
      Appointment.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Appointment.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Appointment.aggregate([
        { $match: match },
        { $group: { _id: "$serviceId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: "services",
            localField: "_id",
            foreignField: "_id",
            as: "service",
          },
        },
        { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            count: 1,
            name: { $ifNull: ["$service.name", "Unknown"] },
          },
        },
      ]),
      Appointment.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
            noShow: { $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const t = totals[0] || {
      total: 0,
      completed: 0,
      noShow: 0,
      cancelled: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    const decided = t.completed + t.noShow + t.cancelled + t.rejected + t.approved;
    res.json({
      success: true,
      analytics: {
        days,
        totals: t,
        rates: {
          completionRate: decided ? Math.round((t.completed / decided) * 100) : 0,
          noShowRate: decided ? Math.round((t.noShow / decided) * 100) : 0,
          cancelRate: decided ? Math.round((t.cancelled / decided) * 100) : 0,
        },
        byStatus: byStatus.map((row) => ({ status: row._id, count: row.count })),
        byDay: byDay.map((row) => ({ date: row._id, count: row.count })),
        byService: byService.map((row) => ({ name: row.name, count: row.count })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/:id/calendar", async (req, res, next) => {
  try {
    const appointment = await loadOwnedAppointment(req, req.params.id);
    const calendar = appointmentCalendarPayload(appointment, {
      patient: appointment.patientId,
      doctor: appointment.doctorId,
      service: appointment.serviceId,
      publicToken: appointment.publicToken,
    });
    res.json({
      success: true,
      calendar: {
        googleUrl: calendar.googleUrl,
        icsUrl: `/api/appointments/calendar/${appointment.publicToken}`,
        statusUrl: calendar.statusUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
