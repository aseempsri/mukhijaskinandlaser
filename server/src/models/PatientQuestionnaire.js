import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    primaryConcern: { type: String, default: "" },
    symptoms: { type: [String], default: [] },
    duration: { type: String, default: "" },
    previousTreatment: { type: Boolean, default: false },
    previousTreatmentDetails: { type: String, default: "" },
    additionalNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

questionnaireSchema.index({ appointmentId: 1 });

export const PatientQuestionnaire = mongoose.model("PatientQuestionnaire", questionnaireSchema);
