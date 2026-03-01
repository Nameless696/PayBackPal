/**
 * PayBackPal — Auth Controller
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 * PATCH /api/auth/profile
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: sign JWT ──────────────────────────────────────────────
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ── Register ──────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        const user  = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
        const token = signToken(user._id);

        res.status(201).json({ token, user: user.toProfile() });
    } catch (err) {
        next(err);
    }
};

// ── Login ─────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = signToken(user._id);
        res.json({ token, user: user.toProfile() });
    } catch (err) {
        next(err);
    }
};

// ── Get current user ──────────────────────────────────────────────
exports.getMe = async (req, res) => {
    res.json({ user: req.user.toProfile() });
};

// ── Update profile ────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findById(req.user._id);

        if (name)  user.name  = name.trim();
        if (email) user.email = email.toLowerCase().trim();
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters' });
            }
            user.password = password; // pre-save hook will re-hash
        }

        await user.save();
        res.json({ user: user.toProfile() });
    } catch (err) {
        next(err);
    }
};
