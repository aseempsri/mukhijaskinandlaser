import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

/**
 * Keeps the clinic dashboard login password in sync with DASHBOARD_PASS in .env.
 * Safe to run on every boot — does not wipe appointments.
 */
export async function syncDashboardPasswordFromEnv() {
  if (!env.dashboardPass) {
    console.warn("[auth] DASHBOARD_PASS is not set in server/.env — dashboard password was not updated.");
    return;
  }

  const email = env.dashboardEmail;
  const passwordHash = await bcrypt.hash(env.dashboardPass, 10);
  const result = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        passwordHash,
        role: "admin",
        isActive: true,
      },
      $setOnInsert: {
        email,
        doctorId: null,
      },
    },
    { upsert: true, new: true }
  );

  console.log(`[auth] Dashboard password synced from DASHBOARD_PASS for ${result.email}`);
}
