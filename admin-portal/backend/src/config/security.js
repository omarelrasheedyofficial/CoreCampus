// config/security.js — HTTP security headers (Helmet) and rate limiting (doc §6.2, §6.5.1).
// (Shared file: keep identical in every portal's backend.)
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './env.js';

const WINDOW_MS = 15 * 60 * 1000;

function limiter(limit, message) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
  });
}

/** General API limit per client IP. */
export const apiLimiter = limiter(600, 'Too many requests. Please wait a few minutes and try again.');

/** Stricter limit for file uploads (materials, submissions). */
export const uploadLimiter = limiter(40, 'Too many uploads. Please wait a few minutes and try again.');

/**
 * Security headers. The CSP allows the built React app (same origin) to call this API and
 * Supabase Auth, and nothing else; no inline scripts, no framing.
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", env.supabaseUrl],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        // HTTPS-only in production (Render); off locally so a production build works on http://localhost
        upgradeInsecureRequests: env.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}
