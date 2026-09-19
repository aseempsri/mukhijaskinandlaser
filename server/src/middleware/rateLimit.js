const buckets = new Map();

/**
 * Lightweight in-memory rate limiter (per process).
 * keyFn(req) should return a stable string (e.g. IP + route).
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 30, keyFn, message } = {}) {
  return (req, res, next) => {
    const key = (keyFn ? keyFn(req) : null) || req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        message: message || "Too many requests. Please try again later.",
      });
    }
    return next();
  };
}

export function clientKey(req, suffix = "") {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.ip) || "unknown";
  return `${ip.trim()}:${suffix}`;
}
