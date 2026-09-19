import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    /** When true, receives staff_new_appointment WhatsApp on new bookings */
    receiveNewAppointmentWhatsApp: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffSchema.index({ phone: 1 }, { unique: true });
staffSchema.index({ receiveNewAppointmentWhatsApp: 1, isActive: 1 });

export const Staff = mongoose.model("Staff", staffSchema);
