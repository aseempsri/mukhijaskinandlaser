import { env } from "../config/env.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Build UTC-ish ICS stamp from Asia/Kolkata local date + HH:mm (no DST in IST). */
function toIcsLocalStamp(dateStr, timeStr) {
  const [y, m, d] = String(dateStr).slice(0, 10).split("-");
  const [hh, mm] = String(timeStr).split(":");
  return `${y}${m}${d}T${pad(hh)}${pad(mm)}00`;
}

function escapeIcs(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildGoogleCalendarUrl({ title, details, location, date, startTime, endTime }) {
  const start = toIcsLocalStamp(date, startTime);
  const end = toIcsLocalStamp(date, endTime);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || env.clinicName,
    details: details || "",
    location: location || env.clinicAddress,
    dates: `${start}/${end}`,
    ctz: env.clinicTimezone || "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsEvent({
  uid,
  title,
  description,
  location,
  date,
  startTime,
  endTime,
  url,
}) {
  const dtStart = toIcsLocalStamp(date, startTime);
  const dtEnd = toIcsLocalStamp(date, endTime);
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mukhija Skin Clinic//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${env.clinicTimezone || "Asia/Kolkata"}:${dtStart}`,
    `DTEND;TZID=${env.clinicTimezone || "Asia/Kolkata"}:${dtEnd}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location || env.clinicAddress)}`,
  ];
  if (url) lines.push(`URL:${url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function appointmentCalendarPayload(appointment, { patient, doctor, service, publicToken } = {}) {
  const date = appointment.appointmentDate?.toISOString?.().slice(0, 10)
    || String(appointment.date || "").slice(0, 10);
  const title = `${service?.name || "Appointment"} — ${env.clinicName}`;
  const description = [
    `Appointment ${appointment.appointmentNumber}`,
    patient?.fullName ? `Patient: ${patient.fullName}` : null,
    doctor?.name ? `Doctor: ${doctor.name}` : null,
    `Status: ${appointment.status}`,
    publicToken ? `Status: ${env.appUrl}/appointment-status/${publicToken}/` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const statusUrl = publicToken ? `${env.appUrl}/appointment-status/${publicToken}/` : env.appUrl;
  return {
    date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    title,
    description,
    location: env.clinicAddress,
    googleUrl: buildGoogleCalendarUrl({
      title,
      details: description,
      location: env.clinicAddress,
      date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    }),
    ics: buildIcsEvent({
      uid: `${appointment.appointmentNumber}@mukhijaskinclinic.com`,
      title,
      description,
      location: env.clinicAddress,
      date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      url: statusUrl,
    }),
    statusUrl,
  };
}
