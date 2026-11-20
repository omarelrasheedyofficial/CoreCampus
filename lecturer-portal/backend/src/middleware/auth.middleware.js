import { verifyAccessToken } from '../config/supabase.js';
import * as usersRepository from '../modules/users/users.repository.js';
import { AppError } from './error.middleware.js';

// Endpoints still usable while a first-login password change is pending.
const PASSWORD_CHANGE_ALLOWED = new Set(['/api/auth/me', '/api/auth/password']);

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required.', 401);
  }

  let identity;
  try {
    identity = await verifyAccessToken(token);
  } catch {
    throw new AppError('Invalid or expired session. Please log in again.', 401);
  }

  const user = await usersRepository.findByAuthUserId(identity.authUserId);
  if (!user) {
    throw new AppError('This account is not registered in CampusCore.', 403);
  }
  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  // A new account must replace the password the administrator chose before using anything else.
  if (identity.mustChangePassword && !PASSWORD_CHANGE_ALLOWED.has(req.originalUrl.split('?')[0])) {
    throw new AppError('Change your password to continue.', 428);
  }

  req.user = user;
  req.auth = identity;
  next();
}
