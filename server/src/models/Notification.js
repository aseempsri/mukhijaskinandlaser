import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    recipientType: { type: String, enum: ["doctor", "patient", "staff"], required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    channel: { type: String, enum: ["email", "whatsapp", "dashboard"], required: true },
    eventType: { type: String, required: true },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    status: { type: String, enum: ["queued", "sent", "failed", "skipped"], default: "queued" },
    providerResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    sentAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ appointmentId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
