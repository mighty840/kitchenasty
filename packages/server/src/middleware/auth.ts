import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Placeholder values that have shipped in this repo's code, compose file and docs.
// Anyone can sign tokens with them, so they are treated the same as no secret at all.
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'dev-secret-change-me',
  'change-this-to-a-random-secret',
  'your-random-secret-here',
  'CHANGE_ME_to_a_random_secret_here',
]);

export function resolveJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim();
  if (secret && !KNOWN_PLACEHOLDER_SECRETS.has(secret)) return secret;
  throw new Error(
    secret
      ? 'JWT_SECRET is set to a publicly known placeholder. Generate one with: openssl rand -hex 32'
      : 'JWT_SECRET is not set. Generate one with: openssl rand -hex 32',
  );
}

const JWT_SECRET = resolveJwtSecret();

export interface JwtPayload {
  id: string;
  email: string;
  type: 'staff' | 'customer';
  role?: Role;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends JwtPayload {}
  }
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.type !== 'staff') {
    res.status(403).json({ success: false, error: 'Staff access required' });
    return;
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.type !== 'staff' || !req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      req.user = verifyToken(token);
    } catch {
      // Token invalid, continue without auth
    }
  }
  next();
}
