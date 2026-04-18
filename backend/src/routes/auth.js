const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendTokenResponse, signToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Passport Google OAuth ──────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = profile.photos[0]?.value;
            await user.save({ validateBeforeSave: false });
          } else {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              avatar: profile.photos[0]?.value,
            });
          }
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
  }
  next();
};

// ── Register ───────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ status: 'error', message: 'Email already in use.' });
      }

      const user = await User.create({ name, email, password });
      sendTokenResponse(user, 201, res);
    } catch (err) {
      next(err);
    }
  }
);

// ── Login ──────────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.password) {
        return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      }

      const valid = await user.comparePassword(password);
      if (!valid) {
        return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
      }

      user.lastActive = new Date();
      await user.save({ validateBeforeSave: false });

      sendTokenResponse(user, 200, res);
    } catch (err) {
      next(err);
    }
  }
);

// ── Google OAuth ───────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  (req, res) => {
    const token = signToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// ── Get current user ───────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ status: 'success', data: { user } });
});

// ── Update profile ─────────────────────────────────────────────────────────
router.patch(
  '/me',
  protect,
  [body('name').optional().trim().isLength({ min: 1, max: 50 })],
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['name', 'avatar', 'preferences'];
      const updates = {};
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({ status: 'success', data: { user } });
    } catch (err) {
      next(err);
    }
  }
);

// ── Change password ────────────────────────────────────────────────────────
router.patch(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('+password');

      if (!user.password) {
        return res.status(400).json({ status: 'error', message: 'OAuth account — no password set.' });
      }

      const valid = await user.comparePassword(req.body.currentPassword);
      if (!valid) {
        return res.status(401).json({ status: 'error', message: 'Current password is incorrect.' });
      }

      user.password = req.body.newPassword;
      await user.save();

      sendTokenResponse(user, 200, res);
    } catch (err) {
      next(err);
    }
  }
);

// ── Logout ─────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.cookie('jwt', 'loggedout', { expires: new Date(Date.now() + 5000), httpOnly: true });
  res.json({ status: 'success', message: 'Logged out successfully.' });
});

module.exports = router;
