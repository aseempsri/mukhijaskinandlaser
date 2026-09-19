import bcrypt from "bcryptjs";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { User } from "./models/User.js";
import { Doctor } from "./models/Doctor.js";
import { Service } from "./models/Service.js";
import { DoctorAvailability } from "./models/DoctorAvailability.js";
import { ClinicSetting } from "./models/ClinicSetting.js";

async function seed() {
  await connectDb();

  if (!env.dashboardPass) {
    throw new Error("Set DASHBOARD_PASS in server/.env before seeding.");
  }

  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Service.deleteMany({}),
    DoctorAvailability.deleteMany({}),
    ClinicSetting.deleteMany({}),
  ]);

  const doctors = await Doctor.insertMany([
    {
      name: "Dr. R. D. Mukhija",
      title: "Founder · Senior Dermatologist",
      email: "rd.mukhija@mukhijaskinclinic.com",
      phone: "+919554220700",
      whatsappNumber: "+919554220700",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
    {
      name: "Dr. Gaurav Mukhija",
      title: "Dermatologist · Cosmetic & Laser Specialist",
      email: "gaurav.mukhija@mukhijaskinclinic.com",
      phone: "+919554220700",
      whatsappNumber: "+919554220700",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
  ]);

  const passwordHash = await bcrypt.hash(env.dashboardPass, 10);
  await User.insertMany([
    {
      email: env.dashboardEmail,
      passwordHash,
      role: "admin",
      doctorId: null,
      isActive: true,
    },
  ]);

  const services = await Service.insertMany([
    { name: "General Consultation", slug: "general-consultation", description: "Dermatologist consultation for skin, hair or aesthetic concerns.", durationMinutes: 30, sortOrder: 1 },
    { name: "Acne Consultation", slug: "acne-consultation", description: "Evaluation for acne and acne scarring.", durationMinutes: 30, sortOrder: 2 },
    { name: "Pigmentation Consultation", slug: "pigmentation-consultation", description: "Assessment for melasma and uneven pigmentation.", durationMinutes: 30, sortOrder: 3 },
    { name: "Hair Fall Consultation", slug: "hair-fall-consultation", description: "Hair loss evaluation including PRP discussion.", durationMinutes: 30, sortOrder: 4 },
    { name: "Laser Consultation", slug: "laser-consultation", description: "Laser and aesthetic treatment planning.", durationMinutes: 30, sortOrder: 5 },
    { name: "Skin Rejuvenation", slug: "skin-rejuvenation", description: "Consultation for texture, tone and rejuvenation options.", durationMinutes: 30, sortOrder: 6 },
    { name: "Anti-Aging Consultation", slug: "anti-aging-consultation", description: "Wrinkles and ageing skin assessment.", durationMinutes: 30, sortOrder: 7 },
    { name: "Vitiligo Consultation", slug: "vitiligo-consultation", description: "Medical dermatology consultation for vitiligo.", durationMinutes: 30, sortOrder: 8 },
  ]);

  const windows = [
    { startTime: "12:00", endTime: "15:00", slotMinutes: 30 },
    { startTime: "16:00", endTime: "18:00", slotMinutes: 30 },
  ];
  const availabilityDocs = [];
  for (const doctor of doctors) {
    for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek += 1) {
      for (const window of windows) {
        availabilityDocs.push({
          doctorId: doctor._id,
          dayOfWeek,
          ...window,
          isActive: true,
        });
      }
    }
  }
  await DoctorAvailability.insertMany(availabilityDocs);

  await ClinicSetting.insertMany([
    { key: "timezone", value: "Asia/Kolkata" },
    { key: "consentVersion", value: "2026-01" },
    { key: "clinicPhone", value: "+91-9554220700" },
  ]);

  console.log("Seed complete.");
  console.log(`Doctors: ${doctors.length}, Services: ${services.length}`);
  console.log(`Login: ${env.dashboardEmail} / (DASHBOARD_PASS from server/.env)`);
  console.log("After login, select Dr. R. D. Mukhija or Dr. Gaurav Mukhija in the dashboard.");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
