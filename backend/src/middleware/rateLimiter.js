const rateLimit = require("express-rate-limit");

// General rate limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Do not block local dev while iterating on auth flows.
  skip: (req) => {
    if (process.env.NODE_ENV !== "development") return false;
    const ip = req.ip || req.socket?.remoteAddress || "";
    const localhostIps = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
    return localhostIps.includes(ip);
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
};
