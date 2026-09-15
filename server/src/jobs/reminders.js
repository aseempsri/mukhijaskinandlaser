import cron from "node-cron";
import { Appointment } from "../models/Appointment.js";
import { Notification } from "../models/Notification.js";
import { NotificationService } from "../services/notifications.js";
import { parseDateOnly } from "../utils/time.js";

function getTodayKolkata() {
  const now = new Date();
  const y = now.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" });
  const m = now.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", month: "2-digit" });
  const d = now.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", day: "2-digit" });
  return parseDateOnly(`${y}-${m}-${d}`);
}

function getTomorrowKolkata() {
  const today = getTodayKolkata();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

async function send24HourReminders() {
  console.log("[reminders] Running 24-hour reminder job...");
  try {
    const tomorrow = getTomorrowKolkata();
    const appointments = await Appointment.find({
      status: "APPROVED",
      appointmentDate: tomorrow,
    })
      .populate("patientId")
      .populate("doctorId")
      .populate("serviceId");

    console.log(`[reminders] Found ${appointments.length} appointments for tomorrow`);

    for (const appointment of appointments) {
      const existing = await Notification.findOne({
        appointmentId: appointment._id,
        eventType: "APPOINTMENT_REMINDER_24H",
        status: { $in: ["sent", "queued"] },
      });

      if (!existing) {
        console.log(`[reminders] Sending 24h reminder for ${appointment.appointmentNumber}`);
        await NotificationService.sendAppointmentReminder({
          appointment,
          patient: appointment.patientId,
          doctor: appointment.doctorId,
          service: appointment.serviceId,
          hoursBeforeType: "24h",
        });
      }
    }

    console.log("[reminders] 24-hour reminder job completed");
  } catch (error) {
    console.error("[reminders] Error in 24-hour reminder job:", error);
  }
}

async function send2HourReminders() {
  console.log("[reminders] Running 2-hour reminder job...");
  try {
    const today = getTodayKolkata();
    const now = new Date();
    const currentHour = parseInt(now.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
    const currentMinute = parseInt(now.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", minute: "2-digit" }));
    
    const targetHourStart = currentHour + 1;
    const targetHourEnd = currentHour + 3;
    const targetStartTime = `${String(targetHourStart).padStart(2, "0")}:00`;
    const targetEndTime = `${String(targetHourEnd).padStart(2, "0")}:00`;

    const appointments = await Appointment.find({
      status: "APPROVED",
      appointmentDate: today,
      startTime: { $gte: targetStartTime, $lt: targetEndTime },
    })
      .populate("patientId")
      .populate("doctorId")
      .populate("serviceId");

    console.log(`[reminders] Found ${appointments.length} appointments starting between ${targetStartTime} and ${targetEndTime}`);

    for (const appointment of appointments) {
      const existing = await Notification.findOne({
        appointmentId: appointment._id,
        eventType: "APPOINTMENT_REMINDER_2H",
        status: { $in: ["sent", "queued"] },
      });

      if (!existing) {
        console.log(`[reminders] Sending 2h reminder for ${appointment.appointmentNumber}`);
        await NotificationService.sendAppointmentReminder({
          appointment,
          patient: appointment.patientId,
          doctor: appointment.doctorId,
          service: appointment.serviceId,
          hoursBeforeType: "2h",
        });
      }
    }

    console.log("[reminders] 2-hour reminder job completed");
  } catch (error) {
    console.error("[reminders] Error in 2-hour reminder job:", error);
  }
}

export function startReminderJobs() {
  console.log("[reminders] Starting reminder cron jobs...");

  cron.schedule("0 20 * * *", send24HourReminders, {
    timezone: "Asia/Kolkata",
  });
  console.log("[reminders] 24-hour reminder job scheduled (runs daily at 8 PM IST)");

  cron.schedule("*/30 * * * *", send2HourReminders, {
    timezone: "Asia/Kolkata",
  });
  console.log("[reminders] 2-hour reminder job scheduled (runs every 30 minutes)");

  console.log("[reminders] All reminder jobs started successfully");
}
