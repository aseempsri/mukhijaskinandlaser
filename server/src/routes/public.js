import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { Doctor } from "../models/Doctor.js";
import { Service } from "../models/Service.js";
import { Patient } from "../models/Patient.js";
import { Appointment } from "../models/Appointment.js";
import { AppointmentStatusHistory } from "../models/AppointmentStatusHistory.js";
import { PatientQuestionnaire } from "../models/PatientQuestionnaire.js";
import { PatientImage } from "../models/PatientImage.js";
import { Notification } from "../models/Notification.js";
import { assertSlotAvailable, getAvailableSlots } from "../services/availability.js";
import { isDuplicateKeyError, slotConflictError, withDoctorDateLock } from "../services/bookingLock.js";
import { appointmentCalendarPayload } from "../services/calendar.js";
import { NotificationService, notifyInBackground } from "../services/notifications.js";
import { clientKey, rateLimit } from "../middleware/rateLimit.js";
import {
  addMinutesToTime,
  createAppointmentNumber,
  createPublicToken,
  formatDateOnly,
  parseDateOnly,
  timeToMinutes,
} from "../utils/time.js";
import crypto from "node:crypto";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyFn: (req) => clientKey(req, "booking"),
  message: "Too many booking attempts. Please wait a few minutes and try again.",
});

const statusActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyFn: (req) => clientKey(req, "status-action"),
  message: "Too many requests. Please wait and try again.",
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter(req, file, cb) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WebP images are allowed."));
    }
    cb(null, true);
  },
});

router.get("/services", async (_req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, services });
  } catch (error) {
    next(error);
  }
});

router.get("/doctors", async (_req, res, next) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/available-slots", async (req, res, next) => {
  try {
    const schema = z.object({
      doctorId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      serviceId: z.string().optional(),
      excludeAppointmentId: z.string().optional(),
      includePast: z
        .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
        .optional(),
    });
    const query = schema.parse(req.query);
    let durationMinutes = 30;
    if (query.serviceId) {
      const service = await Service.findById(query.serviceId);
      if (service) durationMinutes = service.durationMinutes;
    }
    const includePast = query.includePast === "1" || query.includePast === "true";
    const slots = await getAvailableSlots({
      doctorId: query.doctorId,
      date: query.date,
      durationMinutes,
      excludeAppointmentId: query.excludeAppointmentId || null,
      includePast,
    });
    res.json({ success: true, date: query.date, slots });
  } catch (error) {
    if (error.name === "ZodError") {
      error.status = 400;
      error.message = "Invalid availability query.";
      error.details = error.errors;
    }
    next(error);
  }
});

router.get("/appointments/status/:token", async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ publicToken: req.params.token })
      .populate("doctorId", "name title")
      .populate("serviceId", "name durationMinutes")
      .populate("patientId", "fullName phone email");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });
    const patientEmailNotice = await Notification.findOne({
      appointmentId: appointment._id,
      recipientType: "patient",
      channel: "email",
      eventType: "APPOINTMENT_REQUESTED",
    }).sort({ createdAt: -1 });
    const calendar = appointmentCalendarPayload(appointment, {
      patient: appointment.patientId,
      doctor: appointment.doctorId,
      service: appointment.serviceId,
      publicToken: appointment.publicToken,
    });
    const canActOnReschedule = appointment.status === "RESCHEDULE_REQUESTED";
    const canCancel = !["CANCELLED", "COMPLETED", "REJECTED", "NO_SHOW"].includes(appointment.status);
    res.json({
      success: true,
      appointment: {
        appointmentNumber: appointment.appointmentNumber,
        status: appointment.status,
        date: formatDateOnly(appointment.appointmentDate),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        doctor: appointment.doctorId,
        service: appointment.serviceId,
        patient: {
          fullName: appointment.patientId.fullName,
          phone: appointment.patientId.phone,
        },
        rescheduleReason: appointment.rescheduleReason || null,
        canAcceptReschedule: canActOnReschedule,
        canDeclineReschedule: canActOnReschedule,
        canCancel,
        calendar: {
          googleUrl: calendar.googleUrl,
          icsUrl: `/api/appointments/calendar/${appointment.publicToken}`,
        },
        emailNotice: patientEmailNotice
          ? { status: patientEmailNotice.status, error: patientEmailNotice.errorMessage || null }
          : { status: appointment.patientId.email ? "pending" : "none" },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/appointments/calendar/:token", async (req, res, next) => {
  try {
    const token = String(req.params.token || "").replace(/\.ics$/i, "");
    const appointment = await Appointment.findOne({ publicToken: token })
      .populate("doctorId", "name")
      .populate("serviceId", "name")
      .populate("patientId", "fullName");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });
    const calendar = appointmentCalendarPayload(appointment, {
      patient: appointment.patientId,
      doctor: appointment.doctorId,
      service: appointment.serviceId,
      publicToken: appointment.publicToken,
    });
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${appointment.appointmentNumber}.ics"`
    );
    res.send(calendar.ics);
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/cancel/:token", statusActionLimiter, async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ publicToken: req.params.token })
      .populate("doctorId")
      .populate("serviceId")
      .populate("patientId");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });

    if (["CANCELLED", "COMPLETED", "REJECTED", "NO_SHOW"].includes(appointment.status)) {
      const error = new Error(`Cannot cancel appointment with status ${appointment.status}.`);
      error.status = 409;
      throw error;
    }

    const reason = req.body.reason || "Cancelled by patient";
    const fromStatus = appointment.status;
    appointment.status = "CANCELLED";
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;
    await appointment.save();

    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "CANCELLED",
      note: reason,
    });

    notifyInBackground(() =>
      NotificationService.sendAppointmentCancelled({
        appointment,
        patient: appointment.patientId,
        doctor: appointment.doctorId,
        reason,
        cancelledBy: "patient",
      })
    );

    res.json({ success: true, message: "Appointment cancelled successfully." });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/reschedule/:token/accept", statusActionLimiter, async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ publicToken: req.params.token })
      .populate("doctorId")
      .populate("serviceId")
      .populate("patientId");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });
    if (appointment.status !== "RESCHEDULE_REQUESTED") {
      const error = new Error("No reschedule proposal is waiting for your response.");
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
        note: "Patient accepted reschedule proposal",
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

    res.json({ success: true, message: "Reschedule accepted. Your appointment is confirmed.", appointment });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments/reschedule/:token/decline", statusActionLimiter, async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ publicToken: req.params.token })
      .populate("doctorId")
      .populate("serviceId")
      .populate("patientId");
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found." });
    if (appointment.status !== "RESCHEDULE_REQUESTED") {
      const error = new Error("No reschedule proposal is waiting for your response.");
      error.status = 409;
      throw error;
    }

    const reason = req.body.reason || "Patient declined the proposed new time";
    const fromStatus = appointment.status;
    appointment.status = "CANCELLED";
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;
    await appointment.save();

    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus,
      toStatus: "CANCELLED",
      note: reason,
    });

    notifyInBackground(() =>
      NotificationService.sendAppointmentCancelled({
        appointment,
        patient: appointment.patientId,
        doctor: appointment.doctorId,
        reason,
        cancelledBy: "patient",
      })
    );

    res.json({ success: true, message: "Reschedule declined. Please book another slot if needed." });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments", bookingLimiter, upload.array("photos", 5), async (req, res, next) => {
  try {
    const raw = req.body.payload ? JSON.parse(req.body.payload) : req.body;
    const schema = z.object({
      serviceId: z.string().min(1),
      doctorId: z.string().min(1),
      appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      patient: z.object({
        fullName: z.string().min(2),
        phone: z.string().min(8),
        email: z.string().email().optional().or(z.literal("")),
        age: z.coerce.number().int().min(1).max(120).optional().nullable(),
        gender: z.string().optional().nullable(),
        whatsappOptIn: z.boolean().optional().default(true),
        emailOptIn: z.boolean().optional().default(true),
      }),
      questionnaire: z
        .object({
          primaryConcern: z.string().optional().default(""),
          symptoms: z.array(z.string()).optional().default([]),
          duration: z.string().optional().default(""),
          previousTreatment: z.boolean().optional().default(false),
          previousTreatmentDetails: z.string().optional().default(""),
          additionalNotes: z.string().optional().default(""),
        })
        .optional(),
      consent: z.object({
        given: z.literal(true),
        version: z.string().default("2026-01"),
      }),
      patientNotes: z.string().optional(),
    });

    const body = schema.parse(raw);
    const service = await Service.findOne({ _id: body.serviceId, isActive: true });
    if (!service) {
      const error = new Error("Service not found.");
      error.status = 404;
      throw error;
    }
    const doctor = await Doctor.findOne({ _id: body.doctorId, isActive: true });
    if (!doctor) {
      const error = new Error("Doctor not found.");
      error.status = 404;
      throw error;
    }

    const endTime = body.endTime || addMinutesToTime(body.startTime, service.durationMinutes);
    if (timeToMinutes(endTime) <= timeToMinutes(body.startTime)) {
      const error = new Error("Invalid time range.");
      error.status = 400;
      throw error;
    }

    const appointment = await withDoctorDateLock(doctor._id, body.appointmentDate, async () => {
      await assertSlotAvailable({
        doctorId: doctor._id,
        date: body.appointmentDate,
        startTime: body.startTime,
        endTime,
      });

      let patient = await Patient.findOne({ phone: body.patient.phone.trim() });
      if (!patient) {
        patient = await Patient.create({
          fullName: body.patient.fullName.trim(),
          phone: body.patient.phone.trim(),
          email: body.patient.email || null,
          age: body.patient.age ?? null,
          gender: body.patient.gender || null,
          whatsappOptIn: body.patient.whatsappOptIn ?? true,
          emailOptIn: body.patient.emailOptIn ?? true,
        });
      } else {
        patient.fullName = body.patient.fullName.trim();
        patient.email = body.patient.email || patient.email;
        patient.age = body.patient.age ?? patient.age;
        patient.gender = body.patient.gender || patient.gender;
        patient.whatsappOptIn = body.patient.whatsappOptIn ?? patient.whatsappOptIn;
        patient.emailOptIn = body.patient.emailOptIn ?? patient.emailOptIn;
        await patient.save();
      }

      const appointmentDate = parseDateOnly(body.appointmentDate);
      let created;
      try {
        created = await Appointment.create({
          appointmentNumber: createAppointmentNumber(appointmentDate),
          patientId: patient._id,
          doctorId: doctor._id,
          serviceId: service._id,
          appointmentDate,
          startTime: body.startTime,
          endTime,
          status: "PENDING",
          bookingSource: "WEBSITE",
          patientNotes: body.patientNotes || body.questionnaire?.additionalNotes || null,
          publicToken: createPublicToken(),
          consentGiven: true,
          consentVersion: body.consent.version,
        });
      } catch (error) {
        if (isDuplicateKeyError(error)) throw slotConflictError();
        throw error;
      }

      await AppointmentStatusHistory.create({
        appointmentId: created._id,
        fromStatus: null,
        toStatus: "PENDING",
        note: "Created from website booking form",
      });

      if (body.questionnaire) {
        await PatientQuestionnaire.create({
          appointmentId: created._id,
          patientId: patient._id,
          ...body.questionnaire,
        });
      }

      if (req.files?.length) {
        for (const file of req.files) {
          await PatientImage.create({
            appointmentId: created._id,
            patientId: patient._id,
            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storagePath: file.path,
          });
        }
      }

      patient.lastAppointmentAt = new Date();
      await patient.save();

      notifyInBackground(() =>
        NotificationService.sendAppointmentRequested({
          appointment: created,
          patient,
          doctor,
          service,
        })
      );

      return created;
    });

    res.status(201).json({
      success: true,
      appointment: {
        id: appointment._id,
        appointmentNumber: appointment.appointmentNumber,
        status: appointment.status,
        date: body.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        publicToken: appointment.publicToken,
        statusUrl: `/appointment-status/${appointment.publicToken}/`,
      },
    });
  } catch (error) {
    if (error.name === "ZodError") {
      error.status = 400;
      error.message = "Invalid booking payload.";
      error.details = error.errors;
    }
    next(error);
  }
});

export default router;
