import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
  },
  { timestamps: true }
);

imageSchema.index({ appointmentId: 1 });

export const PatientImage = mongoose.model("PatientImage", imageSchema);
