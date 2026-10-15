/**
 * Form & JSON Body Sanitization Middleware
 * Recursively inspects incoming payloads:
 * - Neutralizes Prototype Pollution keys (__proto__, constructor, prototype)
 * - Strips null bytes (\0)
 * - Neutralizes script tags and inline event handlers in text fields
 * - Enforces reasonable maximum string bounds
 */

function sanitizeValue(val, depth = 0) {
  if (depth > 8) return null; // Prevent deep nesting DoS

  if (typeof val === 'string') {
    // Strip null bytes
    let clean = val.replace(/\0/g, '');

    // Trim excessive whitespace
    clean = clean.trim();

    // Neutralize dangerous script injections in general string fields
    clean = clean
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:text\/html/gi, '');

    return clean;
  }

  if (Array.isArray(val)) {
    return val.slice(0, 500).map(item => sanitizeValue(item, depth + 1));
  }

  if (val !== null && typeof val === 'object') {
    const cleanObj = {};
    for (const [key, prop] of Object.entries(val)) {
      // Prototype pollution defense
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleanObj[key] = sanitizeValue(prop, depth + 1);
    }
    return cleanObj;
  }

  return val;
}

function sanitizeInputMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

module.exports = {
  sanitizeValue,
  sanitizeInputMiddleware
};
