const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      defaultView: { type: String, enum: ['kanban', 'list', 'calendar'], default: 'kanban' },
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        dueDateReminder: { type: Boolean, default: true },
      },
    },
    notifications: [
      {
        message: String,
        type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
        read: { type: Boolean, default: false },
        link: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
