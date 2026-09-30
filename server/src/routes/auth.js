import { Router } from 'express';
import User from '../models/User.js';
import { asyncH } from '../middleware/error.js';
import { protect, signToken } from '../middleware/auth.js';

const r = Router();

const safe = (u) => ({
  _id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, addresses: u.addresses, createdAt: u.createdAt,
});

r.post('/register', asyncH(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(400).json({ message: 'An account with this email already exists' });
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({ token: signToken(user), user: safe(user) });
}));

r.post('/login', asyncH(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) return res.status(401).json({ message: 'Invalid email or password' });
  if (!user.active) return res.status(403).json({ message: 'This account has been disabled' });
  user.lastLogin = new Date();
  await user.save();
  res.json({ token: signToken(user), user: safe(user) });
}));

r.get('/me', protect, (req, res) => res.json(safe(req.user)));

r.put('/me', protect, asyncH(async (req, res) => {
  const { name, phone, addresses, email } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (Array.isArray(addresses)) req.user.addresses = addresses;
  if (email && email.toLowerCase() !== req.user.email) {
    if (await User.exists({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already in use' });
    req.user.email = email;
  }
  await req.user.save();
  res.json(safe(req.user));
}));

r.put('/password', protect, asyncH(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) return res.status(400).json({ message: 'Current password is incorrect' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
}));

export default r;
