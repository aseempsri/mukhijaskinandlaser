import mongoose from "mongoose";
import { env } from "./env.js";
import { Appointment } from "../models/Appointment.js";
import { BookingLock } from "../models/BookingLock.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  // Ensure unique slot index / TTL lock index exist (safe to call on every boot).
  await Promise.all([Appointment.syncIndexes(), BookingLock.syncIndexes()]);
  console.log(`MongoDB connected: ${env.mongoUri}`);
}
