import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { clientKey, rateLimit } from "../middleware/rateLimit.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyFn: (req) => clientKey(req, `login:${String(req.body?.email || "").toLowerCase()}`),
  message: "Too many login attempts. Please wait and try again.",
});

async function serializeUser(user) {
  const canSwitchDoctors = !user.doctorId || user.role === "admin" || user.role === "receptionist";
  let doctors = [];
  if (canSwitchDoctors) {
    doctors = await Doctor.find({ isActive: true }).sort({ name: 1 }).select("name title");
  } else if (user.doctorId) {
    const doctor = await Doctor.findById(user.doctorId).select("name title");
    if (doctor) doctors = [doctor];
  }
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    doctorId: user.doctorId?._id || user.doctorId || null,
    canSwitchDoctors,
    doctor: user.doctorId && user.doctorId.name
      ? { id: user.doctorId._id, name: user.doctorId.name, title: user.doctorId.title }
      : null,
    doctors: doctors.map((d) => ({ id: d._id, name: d.name, title: d.title })),
  };
}

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });
    const body = schema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase(), isActive: true }).populate("doctorId");
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password." });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid email or password." });
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: await serializeUser(user),
    });
  } catch (error) {
    if (error.name === "ZodError") {
      error.status = 400;
      error.message = "Invalid login payload.";
      error.details = error.errors;
    }
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("doctorId");
    res.json({
      success: true,
      user: await serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
