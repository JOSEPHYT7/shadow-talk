/**
 * Production-Grade In-Memory Rate Limiting Middleware
 * Protects endpoints from DDoS, brute-force credential stuffing, and resource exhaustion.
 */

class MemoryRateLimiter {
  constructor({ windowMs = 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = {}) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.hits = new Map(); // key -> { count, resetTime }

    // Periodically clean up expired entries every 2 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (now > record.resetTime) {
          this.hits.delete(key);
        }
      }
    }, 2 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  getKey(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      const parts = forwarded.split(',');
      if (parts.length && parts[0].trim()) {
        return parts[0].trim();
      }
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();

      let record = this.hits.get(key);
      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs
        };
        this.hits.set(key, record);
      } else {
        record.count += 1;
      }

      const remaining = Math.max(0, this.max - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('RateLimit-Limit', this.max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);

      if (record.count > this.max) {
        res.setHeader('Retry-After', resetSeconds);
        return res.status(429).json({
          success: false,
          error: this.message,
          retryAfterSeconds: resetSeconds
        });
      }

      next();
    };
  }
}

// Global API rate limiter: 300 req / minute
const globalApiLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'High request frequency detected. API requests throttled for 1 minute.'
}).middleware();

// Sensitive authentication endpoints: 10 attempts / 10 minutes
const authLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. IP locked for 10 minutes to protect accounts.'
}).middleware();

// Email OTP delivery: 5 sends / 10 minutes
const otpSendLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'OTP request rate limit reached. Please wait 10 minutes before requesting another code.'
}).middleware();

// File upload rate limiter: 20 uploads / 10 minutes
const uploadLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Upload bandwidth limit reached. Maximum 20 uploads per 10 minutes.'
}).middleware();

// Outbound Browser / Onion Proxy limiter: 30 requests / minute
const proxyLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Proxy sandbox request rate limit reached. Please wait before fetching more external sites.'
}).middleware();

module.exports = {
  MemoryRateLimiter,
  globalApiLimiter,
  authLimiter,
  otpSendLimiter,
  uploadLimiter,
  proxyLimiter
};
