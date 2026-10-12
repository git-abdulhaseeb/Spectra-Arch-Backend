import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { authCheck } from '../middlewares/authCheck.js';
export const authRouter = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cookieName = 'spectra_session';
function publicUser(user) {
    return { id: String(user._id), name: user.name, email: user.email };
}
function issueSession(res, userId) {
    const token = jwt.sign({}, env.jwtSecret, { subject: userId, expiresIn: '7d' });
    res.cookie(cookieName, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
}
authRouter.post('/register', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        if (name.length < 2 || name.length > 60)
            return res.status(400).json({ message: 'Name must be between 2 and 60 characters.' });
        if (!emailPattern.test(email))
            return res.status(400).json({ message: 'Enter a valid email address.' });
        if (password.length < 8 || password.length > 128)
            return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
        if (await User.exists({ email }))
            return res.status(409).json({ message: 'An account with this email already exists.' });
        const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
        issueSession(res, String(user._id));
        return res.status(201).json({ user: publicUser(user) });
    }
    catch (error) {
        return next(error);
    }
});
authRouter.post('/login', async (req, res, next) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password)))
            return res.status(401).json({ message: 'Email or password is incorrect.' });
        issueSession(res, String(user._id));
        return res.json({ user: publicUser(user) });
    }
    catch (error) {
        return next(error);
    }
});
authRouter.get('/me', authCheck, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user)
            return res.status(401).json({ message: 'Session is no longer valid.' });
        return res.json({ user: publicUser(user) });
    }
    catch (error) {
        return next(error);
    }
});
authRouter.patch('/profile', authCheck, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('+password');
        if (!user)
            return res.status(401).json({ message: 'Session is no longer valid.' });
        const name = req.body.name === undefined ? user.name : String(req.body.name).trim();
        if (name.length < 2 || name.length > 60)
            return res.status(400).json({ message: 'Name must be between 2 and 60 characters.' });
        if (req.body.newPassword) {
            const currentPassword = String(req.body.currentPassword || '');
            const newPassword = String(req.body.newPassword);
            if (!(await bcrypt.compare(currentPassword, user.password)))
                return res.status(400).json({ message: 'Current password is incorrect.' });
            if (newPassword.length < 8 || newPassword.length > 128)
                return res.status(400).json({ message: 'New password must be between 8 and 128 characters.' });
            user.password = await bcrypt.hash(newPassword, 12);
        }
        user.name = name;
        await user.save();
        return res.json({ user: publicUser(user) });
    }
    catch (error) {
        return next(error);
    }
});
authRouter.post('/logout', (_req, res) => {
    res.clearCookie(cookieName, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.nodeEnv === 'production',
        path: '/',
    });
    return res.status(204).send();
});
