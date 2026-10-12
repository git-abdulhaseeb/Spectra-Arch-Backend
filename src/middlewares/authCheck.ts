import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  userId?: string;
}

function cookieValue(req: Request, name: string) {
  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
}

export function authCheck(req: AuthRequest, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer || cookieValue(req, 'spectra_session');
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string };
    if (!payload.sub) throw new Error('Missing token subject');
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: 'Session is invalid or has expired.' });
  }
}
