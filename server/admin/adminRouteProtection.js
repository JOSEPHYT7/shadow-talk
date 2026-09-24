/**
 * Administrator Route & API Protection Middleware
 * Restricts access strictly to verified, active administrator sessions.
 * Inspects both Authorization Bearer tokens and HttpOnly cookies.
 */

const { verifyAdminToken, getClientIp, logAuditEvent } = require('./adminAuthSession');

function parseCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function extractAdminToken(req) {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const t = authHeader.slice(7).trim();
    if (t) return t;
  }

  // 2. Custom header: "X-Admin-Token: <token>"
  if (req.headers['x-admin-token']) {
    return req.headers['x-admin-token'].trim();
  }

  // 3. HttpOnly cookie: "st_admin_token"
  const cookieToken = parseCookie(req, 'st_admin_token');
  if (cookieToken) return cookieToken;

  return null;
}

/**
 * Express middleware to protect all /api/admin/* dashboard and management routes
 */
function requireAdminAuth(req, res, next) {
  const token = extractAdminToken(req);
  const clientIp = getClientIp(req);

  if (!token) {
    // Return standard 404 to avoid disclosing endpoint existence to probes
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const session = verifyAdminToken(token);
  if (!session) {
    logAuditEvent('UNAUTHORIZED_ADMIN_API_ACCESS', {
      path: req.originalUrl,
      method: req.method
    }, clientIp);
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  // Attach verified admin session to request
  req.adminSession = session;
  req.adminUsername = session.username;
  next();
}

module.exports = {
  requireAdminAuth,
  extractAdminToken
};
