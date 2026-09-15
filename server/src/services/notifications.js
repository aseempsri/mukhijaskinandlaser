import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { Notification } from "../models/Notification.js";

let transporterPromise = null;

function getSmtpTransporter() {
  if (!transporterPromise) {
    if (!env.smtp.user || !env.smtp.pass) {
      throw new Error("SMTP_USER and SMTP_PASS must be set in server/.env to send email.");
    }
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure, // true for 465, false for 587
        requireTLS: !env.smtp.secure && env.smtp.port === 587,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass,
        },
        tls: {
          minVersion: "TLSv1.2",
        },
      })
    );
  }
  return transporterPromise;
}

async function sendEmail({ to, subject, body }) {
  if (!to) {
    return { provider: env.emailProvider, ok: false, skipped: true, reason: "missing recipient" };
  }

  if (env.emailProvider === "console") {
    console.log(`[email → ${to}] ${subject}\n${body}\n`);
    return { provider: "console", ok: true };
  }

  if (env.emailProvider === "smtp") {
    const transporter = await getSmtpTransporter();
    const info = await transporter.sendMail({
      from: `"${env.clinicName}" <${env.emailFrom}>`,
      to,
      replyTo: env.emailReplyTo || env.emailFrom,
      subject,
      text: body,
    });
    console.log(`[smtp → ${to}] ${subject} messageId=${info.messageId}`);
    return {
      provider: "smtp",
      ok: true,
      messageId: info.messageId,
      response: info.response,
    };
  }

  return { provider: env.emailProvider, ok: false, skipped: true };
}

async function sendWhatsApp({ to, body }) {
  if (env.whatsappProvider === "console") {
    console.log(`[whatsapp → ${to}] ${body}\n`);
    return { provider: "console", ok: true };
  }
  return { provider: env.whatsappProvider, ok: false, skipped: true };
}

async function recordAndSend({
  appointmentId,
  recipientType,
  recipientId,
  channel,
  eventType,
  subject,
  body,
  sendFn,
}) {
  const doc = await Notification.create({
    appointmentId,
    recipientType,
    recipientId,
    channel,
    eventType,
    subject,
    body,
    status: "queued",
  });
  try {
    const response = await sendFn();
    doc.status = response.ok ? "sent" : "skipped";
    doc.providerResponse = response;
    doc.sentAt = new Date();
    await doc.save();
  } catch (error) {
    console.error(`[notification failed] ${channel} ${eventType}:`, error.message);
    doc.status = "failed";
    doc.errorMessage = error.message;
    await doc.save();
  }
  return doc;
}

function formatAppt(appointment, extras = {}) {
  const date = appointment.appointmentDate?.toISOString?.().slice(0, 10) || appointment.date;
  return {
    number: appointment.appointmentNumber,
    date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    ...extras,
  };
}

function doctorEmailRecipients(doctor) {
  const recipients = [];
  if (env.emailStaffTo) recipients.push(env.emailStaffTo);
  if (doctor?.email) recipients.push(doctor.email);
  return [...new Set(recipients.filter(Boolean))];
}

export function notifyInBackground(task) {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error("Background notification failed:", error);
    });
}

export const NotificationService = {
  async sendAppointmentRequested({ appointment, patient, doctor, service }) {
    const summary = formatAppt(appointment, {
      patient: patient.fullName,
      phone: patient.phone,
      service: service.name,
      concern: appointment.patientNotes || "",
    });
    const doctorBody = `New appointment request ${summary.number}\nPatient: ${summary.patient}\nPhone: ${summary.phone}\nService: ${summary.service}\nDate: ${summary.date} ${summary.startTime}\nReview in the doctor dashboard: ${env.appUrl}/doctor-dashboard/`;
    const patientBody = `Dear ${summary.patient},\n\nWe received your appointment request ${summary.number} for ${summary.service} on ${summary.date} at ${summary.startTime}.\n\nStatus: PENDING — our dermatologist will confirm shortly.\n\n${env.clinicName}\nPhone: +91-9554220700`;

    for (const to of doctorEmailRecipients(doctor)) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "doctor",
        recipientId: doctor._id,
        channel: "email",
        eventType: "APPOINTMENT_REQUESTED",
        subject: `New appointment request — ${summary.number}`,
        body: doctorBody,
        sendFn: () => sendEmail({ to, subject: `New appointment request — ${summary.number}`, body: doctorBody }),
      });
    }
    await recordAndSend({
      appointmentId: appointment._id,
      recipientType: "doctor",
      recipientId: doctor._id,
      channel: "whatsapp",
      eventType: "APPOINTMENT_REQUESTED",
      subject: "New appointment request",
      body: doctorBody,
      sendFn: () => sendWhatsApp({ to: doctor.whatsappNumber, body: doctorBody }),
    });
    await recordAndSend({
      appointmentId: appointment._id,
      recipientType: "doctor",
      recipientId: doctor._id,
      channel: "dashboard",
      eventType: "APPOINTMENT_REQUESTED",
      subject: "New pending request",
      body: doctorBody,
      sendFn: async () => ({ provider: "dashboard", ok: true }),
    });

    if (patient.email && patient.emailOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "email",
        eventType: "APPOINTMENT_REQUESTED",
        subject: `Request received — ${summary.number}`,
        body: patientBody,
        sendFn: () => sendEmail({ to: patient.email, subject: `Request received — ${summary.number}`, body: patientBody }),
      });
    }
    if (patient.whatsappOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_REQUESTED",
        subject: "Request received",
        body: patientBody,
        sendFn: () => sendWhatsApp({ to: patient.phone, body: patientBody }),
      });
    }
  },

  async sendAppointmentApproved({ appointment, patient, doctor, service }) {
    const body = `Dear ${patient.fullName},\n\nYour appointment ${appointment.appointmentNumber} for ${service.name} with ${doctor.name} on ${appointment.appointmentDate.toISOString().slice(0, 10)} at ${appointment.startTime} is APPROVED.\n\nWe look forward to seeing you at ${env.clinicName}.\nPhone: +91-9554220700`;
    if (patient.email && patient.emailOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "email",
        eventType: "APPOINTMENT_APPROVED",
        subject: `Appointment approved — ${appointment.appointmentNumber}`,
        body,
        sendFn: () => sendEmail({ to: patient.email, subject: `Appointment approved — ${appointment.appointmentNumber}`, body }),
      });
    }
    if (patient.whatsappOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_APPROVED",
        subject: "Appointment approved",
        body,
        sendFn: () => sendWhatsApp({ to: patient.phone, body }),
      });
    }
  },

  async sendAppointmentRejected({ appointment, patient, reason }) {
    const body = `Dear ${patient.fullName},\n\nYour appointment request ${appointment.appointmentNumber} could not be approved.${reason ? ` Reason: ${reason}` : ""}\n\nPlease call the clinic at +91-9554220700 to choose another slot.\n\n${env.clinicName}`;
    if (patient.email && patient.emailOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "email",
        eventType: "APPOINTMENT_REJECTED",
        subject: `Appointment update — ${appointment.appointmentNumber}`,
        body,
        sendFn: () => sendEmail({ to: patient.email, subject: `Appointment update — ${appointment.appointmentNumber}`, body }),
      });
    }
    if (patient.whatsappOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_REJECTED",
        subject: "Appointment update",
        body,
        sendFn: () => sendWhatsApp({ to: patient.phone, body }),
      });
    }
  },

  async sendAppointmentRescheduled({ appointment, patient, proposedDate, proposedTime, reason }) {
    const body = `Dear ${patient.fullName},\n\nPlease consider a new time for ${appointment.appointmentNumber}: ${proposedDate} at ${proposedTime}.${reason ? ` Note: ${reason}` : ""}\n\nReply via phone/WhatsApp at +91-9554220700 to confirm.\n\n${env.clinicName}`;
    if (patient.email && patient.emailOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "email",
        eventType: "APPOINTMENT_RESCHEDULE_REQUESTED",
        subject: `Reschedule suggested — ${appointment.appointmentNumber}`,
        body,
        sendFn: () => sendEmail({ to: patient.email, subject: `Reschedule suggested — ${appointment.appointmentNumber}`, body }),
      });
    }
    if (patient.whatsappOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_RESCHEDULE_REQUESTED",
        subject: "Reschedule suggested",
        body,
        sendFn: () => sendWhatsApp({ to: patient.phone, body }),
      });
    }
  },

  async sendAppointmentCancelled({ appointment, patient, doctor, reason, cancelledBy }) {
    const body = `Dear ${patient.fullName},\n\nYour appointment ${appointment.appointmentNumber} scheduled for ${appointment.appointmentDate.toISOString().slice(0, 10)} at ${appointment.startTime} has been cancelled.${reason ? `\n\nReason: ${reason}` : ""}\n\nFor any questions, contact us at +91-9554220700.\n\n${env.clinicName}`;
    
    if (patient.email && patient.emailOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "email",
        eventType: "APPOINTMENT_CANCELLED",
        subject: `Appointment cancelled — ${appointment.appointmentNumber}`,
        body,
        sendFn: () => sendEmail({ to: patient.email, subject: `Appointment cancelled — ${appointment.appointmentNumber}`, body }),
      });
    }
    if (patient.whatsappOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_CANCELLED",
        subject: "Appointment cancelled",
        body,
        sendFn: () => sendWhatsApp({ to: patient.phone, body }),
      });
    }

    if (cancelledBy === "patient") {
      const doctorBody = `Appointment ${appointment.appointmentNumber} cancelled by patient.\n\nPatient: ${patient.fullName}\nPhone: ${patient.phone}\nDate: ${appointment.appointmentDate.toISOString().slice(0, 10)} at ${appointment.startTime}${reason ? `\nReason: ${reason}` : ""}`;
      for (const to of doctorEmailRecipients(doctor)) {
        await recordAndSend({
          appointmentId: appointment._id,
          recipientType: "doctor",
          recipientId: doctor._id,
          channel: "email",
          eventType: "APPOINTMENT_CANCELLED",
          subject: `Patient cancelled — ${appointment.appointmentNumber}`,
          body: doctorBody,
          sendFn: () => sendEmail({ to, subject: `Patient cancelled — ${appointment.appointmentNumber}`, body: doctorBody }),
        });
      }
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "doctor",
        recipientId: doctor._id,
        channel: "dashboard",
        eventType: "APPOINTMENT_CANCELLED",
        subject: "Patient cancelled appointment",
        body: doctorBody,
        sendFn: async () => ({ provider: "dashboard", ok: true }),
      });
    }
  },

  async sendAppointmentReminder({ appointment, patient, doctor, service, hoursBeforeType }) {
    const reminderLabel = hoursBeforeType === "24h" ? "tomorrow" : "in 2 hours";
    const body = `Dear ${patient.fullName},\n\nReminder: Your appointment ${appointment.appointmentNumber} for ${service.name} with ${doctor.name} is ${reminderLabel}.\n\nDate: ${appointment.appointmentDate.toISOString().slice(0, 10)}\nTime: ${appointment.startTime}\n\nAddress: ${env.clinicAddress || "Mukhija Skin & Laser Clinic, Gorakhpur"}\n\nSee you soon!\n${env.clinicName}\nPhone: +91-9554220700`;
    
    if (patient.email && patient.emailOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "email",
        eventType: `APPOINTMENT_REMINDER_${hoursBeforeType.toUpperCase()}`,
        subject: `Appointment reminder — ${appointment.appointmentNumber}`,
        body,
        sendFn: () => sendEmail({ to: patient.email, subject: `Appointment reminder — ${appointment.appointmentNumber}`, body }),
      });
    }
    if (patient.whatsappOptIn) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: `APPOINTMENT_REMINDER_${hoursBeforeType.toUpperCase()}`,
        subject: "Appointment reminder",
        body,
        sendFn: () => sendWhatsApp({ to: patient.phone, body }),
      });
    }
  },
};
