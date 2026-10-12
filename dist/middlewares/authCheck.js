import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
function cookieValue(req, name) {
    const cookie = req.headers.cookie
        ?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
}
export function authCheck(req, res, next) {
    const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = bearer || cookieValue(req, 'spectra_session');
    if (!token)
        return res.status(401).json({ message: 'Authentication required.' });
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        if (!payload.sub)
            throw new Error('Missing token subject');
        req.userId = payload.sub;
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Session is invalid or has expired.' });
    }
}
