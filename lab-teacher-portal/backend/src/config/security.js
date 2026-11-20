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

export const apiLimiter = limiter(600, 'Too many requests. Please wait a few minutes and try again.');

export const uploadLimiter = limiter(40, 'Too many uploads. Please wait a few minutes and try again.');

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
        upgradeInsecureRequests: env.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}
