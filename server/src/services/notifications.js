import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { Notification } from "../models/Notification.js";
import { Staff } from "../models/Staff.js";

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

function normalizeWhatsAppTo(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

function formatWhatsAppDate(value) {
  const raw = value?.toISOString?.().slice(0, 10) || String(value || "");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = Number(match[3]);
  const month = months[Number(match[2]) - 1] || match[2];
  return `${day} ${month} ${match[1]}`;
}

function formatWhatsAppTime(time) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return String(time || "");
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

async function sendWhatsApp({ to, body, templateName, templateParams, headerParams }) {
  if (env.whatsappProvider === "console") {
    console.log(`[whatsapp → ${to}] ${templateName || "text"}\n${body}\n`);
    return { provider: "console", ok: true };
  }

  if (env.whatsappProvider !== "meta") {
    return { provider: env.whatsappProvider, ok: false, skipped: true };
  }

  if (!templateName) {
    return {
      provider: "meta",
      ok: false,
      skipped: true,
      reason: "No approved WhatsApp template for this event",
    };
  }

  const { phoneNumberId, accessToken, apiVersion, languageCode } = env.whatsapp;
  if (!phoneNumberId || !accessToken || accessToken === "PASTE_YOUR_TOKEN_HERE") {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN must be set in server/.env");
  }

  const recipient = normalizeWhatsAppTo(to);
  if (!recipient) {
    return { provider: "meta", ok: false, skipped: true, reason: "missing recipient" };
  }

  const components = [];
  if (headerParams?.length) {
    components.push({
      type: "header",
      parameters: headerParams.map((text) => ({
        type: "text",
        text: String(text ?? "").slice(0, 60) || "-",
      })),
    });
  }
  components.push({
    type: "body",
    parameters: (templateParams || []).map((text) => ({
      type: "text",
      text: String(text ?? "").slice(0, 1024) || "-",
    })),
  });

  const payload = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || JSON.stringify(data);
    throw new Error(`Meta WhatsApp API error: ${detail}`);
  }

  console.log(`[whatsapp → ${recipient}] template=${templateName} id=${data?.messages?.[0]?.id || "?"}`);
  return { provider: "meta", ok: true, messageId: data?.messages?.[0]?.id, response: data };
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

    const optedInStaff = await Staff.find({
      isActive: true,
      receiveNewAppointmentWhatsApp: true,
    }).select("name phone");

    const staffWhatsAppTargets = [];
    const seenPhones = new Set();
    for (const member of optedInStaff) {
      const phone = String(member.phone || "").trim();
      if (!phone) continue;
      const key = phone.replace(/\D/g, "");
      if (seenPhones.has(key)) continue;
      seenPhones.add(key);
      staffWhatsAppTargets.push({ id: member._id, phone, name: member.name });
    }

    for (const member of staffWhatsAppTargets) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "staff",
        recipientId: member.id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_REQUESTED",
        subject: `New appointment for ${member.name}`,
        body: doctorBody,
        sendFn: () =>
          sendWhatsApp({
            to: member.phone,
            body: doctorBody,
            templateName: env.whatsapp.templates.staffNew,
            templateParams: [
              summary.number,
              summary.patient,
              summary.phone,
              summary.service,
              formatWhatsAppDate(summary.date),
              formatWhatsAppTime(summary.startTime),
            ],
          }),
      });
    }

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

    if (patient.email) {
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
    if (patient.phone) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_REQUESTED",
        subject: "Request received",
        body: patientBody,
        sendFn: () =>
          sendWhatsApp({
            to: patient.phone,
            body: patientBody,
            templateName: env.whatsapp.templates.requested,
            templateParams: [
              summary.patient,
              summary.number,
              summary.service,
              formatWhatsAppDate(summary.date),
              formatWhatsAppTime(summary.startTime),
            ],
          }),
      });
    }
  },

  async sendAppointmentApproved({ appointment, patient, doctor, service }) {
    const dateLabel = formatWhatsAppDate(appointment.appointmentDate);
    const timeLabel = formatWhatsAppTime(appointment.startTime);
    const body = `Dear ${patient.fullName},\n\nYour appointment ${appointment.appointmentNumber} for ${service.name} with ${doctor.name} on ${dateLabel} at ${timeLabel} is APPROVED.\n\nWe look forward to seeing you at ${env.clinicName}.\nPhone: +91-9554220700`;
    if (patient.email) {
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
    if (patient.phone) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_APPROVED",
        subject: "Appointment approved",
        body,
        sendFn: () =>
          sendWhatsApp({
            to: patient.phone,
            body,
            templateName: env.whatsapp.templates.approved,
            templateParams: [
              patient.fullName,
              appointment.appointmentNumber,
              service.name,
              dateLabel,
              timeLabel,
            ],
          }),
      });
    }
  },

  async sendAppointmentRejected({ appointment, patient, service, reason }) {
    const dateLabel = formatWhatsAppDate(appointment.appointmentDate);
    const timeLabel = formatWhatsAppTime(appointment.startTime);
    const serviceName = service?.name || "your consultation";
    const body = `Dear ${patient.fullName},\n\nYour appointment request ${appointment.appointmentNumber} could not be approved.${reason ? ` Reason: ${reason}` : ""}\n\nPlease call the clinic at +91-9554220700 to choose another slot.\n\n${env.clinicName}`;
    if (patient.email) {
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
    if (patient.phone) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_REJECTED",
        subject: "Appointment update",
        body,
        sendFn: () =>
          sendWhatsApp({
            to: patient.phone,
            body,
            templateName: env.whatsapp.templates.rejected,
            templateParams: [
              patient.fullName,
              appointment.appointmentNumber,
              serviceName,
              dateLabel,
              timeLabel,
            ],
          }),
      });
    }
  },

  async sendAppointmentRescheduled({ appointment, patient, proposedDate, proposedTime, reason }) {
    const dateLabel = formatWhatsAppDate(proposedDate);
    const timeLabel = formatWhatsAppTime(proposedTime);
    const statusUrl = appointment.publicToken
      ? `${env.appUrl.replace(/\/$/, "")}/appointment-status/${appointment.publicToken}/`
      : env.appUrl;
    const body = `Dear ${patient.fullName},\n\nPlease consider a new time for ${appointment.appointmentNumber}: ${dateLabel} at ${timeLabel}.${reason ? ` Note: ${reason}` : ""}\n\nAccept or decline here: ${statusUrl}\n\nOr reply via phone/WhatsApp at +91-9554220700.\n\n${env.clinicName}`;

    const patientEmail = String(patient?.email || "").trim();
    if (patientEmail) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "email",
        eventType: "APPOINTMENT_RESCHEDULE_REQUESTED",
        subject: `Reschedule suggested — ${appointment.appointmentNumber}`,
        body,
        sendFn: () =>
          sendEmail({
            to: patientEmail,
            subject: `Reschedule suggested — ${appointment.appointmentNumber}`,
            body,
          }),
      });
    } else {
      console.warn(
        `[email skip] reschedule ${appointment.appointmentNumber}: patient has no email on file`
      );
    }

    // Clinic inbox copy so staff can confirm the proposal was sent.
    const doctorDoc = appointment.doctorId?.email ? appointment.doctorId : null;
    for (const to of doctorEmailRecipients(doctorDoc)) {
      const staffBody = `Reschedule proposed for ${appointment.appointmentNumber}\nPatient: ${patient.fullName}\nPhone: ${patient.phone}\nNew time: ${dateLabel} at ${timeLabel}\nPatient email: ${patientEmail || "(none)"}\nStatus link: ${statusUrl}`;
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "doctor",
        recipientId: appointment.doctorId?._id || appointment.doctorId || patient._id,
        channel: "email",
        eventType: "APPOINTMENT_RESCHEDULE_REQUESTED",
        subject: `Reschedule proposed — ${appointment.appointmentNumber}`,
        body: staffBody,
        sendFn: () =>
          sendEmail({
            to,
            subject: `Reschedule proposed — ${appointment.appointmentNumber}`,
            body: staffBody,
          }),
      });
    }

    if (patient.phone) {
      await recordAndSend({
        appointmentId: appointment._id,
        recipientType: "patient",
        recipientId: patient._id,
        channel: "whatsapp",
        eventType: "APPOINTMENT_RESCHEDULE_REQUESTED",
        subject: "Reschedule suggested",
        body,
        sendFn: () =>
          sendWhatsApp({
            to: patient.phone,
            body,
            templateName: env.whatsapp.templates.reschedule,
            templateParams: [
              patient.fullName,
              appointment.appointmentNumber,
              dateLabel,
              timeLabel,
            ],
          }),
      });
    }
  },

  async sendAppointmentCancelled({ appointment, patient, doctor, reason, cancelledBy }) {
    const body = `Dear ${patient.fullName},\n\nYour appointment ${appointment.appointmentNumber} scheduled for ${appointment.appointmentDate.toISOString().slice(0, 10)} at ${appointment.startTime} has been cancelled.${reason ? `\n\nReason: ${reason}` : ""}\n\nFor any questions, contact us at +91-9554220700.\n\n${env.clinicName}`;
    
    if (patient.email) {
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
    if (patient.phone) {
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
    
    if (patient.email) {
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
    if (patient.phone) {
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
