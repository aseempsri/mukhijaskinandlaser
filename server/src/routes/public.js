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
import { NotificationService, notifyInBackground } from "../services/notifications.js";
import {
  addMinutesToTime,
  createAppointmentNumber,
  createPublicToken,
  formatDateOnly,
  parseDateOnly,
  timeToMinutes,
} from "../utils/time.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
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
    });
    const query = schema.parse(req.query);
    let durationMinutes = 30;
    if (query.serviceId) {
      const service = await Service.findById(query.serviceId);
      if (service) durationMinutes = service.durationMinutes;
    }
    const slots = await getAvailableSlots({
      doctorId: query.doctorId,
      date: query.date,
      durationMinutes,
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
        emailNotice: patientEmailNotice
          ? { status: patientEmailNotice.status, error: patientEmailNotice.errorMessage || null }
          : { status: appointment.patientId.email ? "pending" : "none" },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/appointments", upload.array("photos", 5), async (req, res, next) => {
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
    const appointment = await Appointment.create({
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

    await AppointmentStatusHistory.create({
      appointmentId: appointment._id,
      fromStatus: null,
      toStatus: "PENDING",
      note: "Created from website booking form",
    });

    if (body.questionnaire) {
      await PatientQuestionnaire.create({
        appointmentId: appointment._id,
        patientId: patient._id,
        ...body.questionnaire,
      });
    }

    if (req.files?.length) {
      for (const file of req.files) {
        await PatientImage.create({
          appointmentId: appointment._id,
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
      NotificationService.sendAppointmentRequested({ appointment, patient, doctor, service })
    );

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
