import express from "express";
import cors from "cors";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import doctorRoutes from "./routes/doctor.js";
import { startReminderJobs } from "./jobs/reminders.js";

async function main() {
  await connectDb();
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  // Patient photos are NOT publicly served — only via authenticated /api/doctor/images/:id

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, service: "mukhija-appointment-api", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", publicRoutes);
  app.use("/api/doctor", doctorRoutes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`Appointment API listening on http://localhost:${env.port}`);
    startReminderJobs();
  });
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
