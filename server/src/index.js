import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import doctorRoutes from "./routes/doctor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await connectDb();
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

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
  });
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
