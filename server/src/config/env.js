import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  appUrl: process.env.APP_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mukhija_clinic",
  authSecret: process.env.AUTH_SECRET || "dev-secret",
  clinicTimezone: process.env.CLINIC_TIMEZONE || "Asia/Kolkata",
  clinicName: process.env.CLINIC_NAME || "Mukhija Skin & Laser Clinic",
  clinicAddress: process.env.CLINIC_ADDRESS || "Mukhija Skin & Laser Clinic, Gorakhpur",
  emailProvider: process.env.EMAIL_PROVIDER || "console",
  emailFrom: process.env.EMAIL_FROM || "appointments@drmukhijaskinclinic.com",
  emailReplyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || "appointments@drmukhijaskinclinic.com",
  /** Clinic inbox that receives new appointment-request alerts */
  emailStaffTo: process.env.EMAIL_STAFF_TO || "appointments@drmukhijaskinclinic.com",
  smtp: {
    host: process.env.SMTP_HOST || "smtpout.secureserver.net",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  whatsappProvider: process.env.WHATSAPP_PROVIDER || "console",
};
