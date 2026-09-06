import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, doctorId: user.doctorId?.toString() || null },
    env.authSecret,
    { expiresIn: "12h" }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Authentication required." });
    const payload = jwt.verify(token, env.authSecret);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: "Invalid session." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }
    next();
  };
}
