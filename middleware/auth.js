const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'glowslides-super-secret-jwt-key-2026-production';

/**
 * Optional Auth Middleware:
 * If Authorization header or cookie exists with valid JWT, attaches req.user.
 * Does not block anonymous/demo guests.
 */
function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.glowslides_token) {
    token = req.cookies.glowslides_token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Invalid/expired token ignored in optional auth
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

/**
 * Required Auth Middleware:
 * Blocks unauthenticated requests with 401.
 */
function requireAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.glowslides_token) {
    token = req.cookies.glowslides_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in again.' });
  }
}

module.exports = {
  optionalAuth,
  requireAuth
};
