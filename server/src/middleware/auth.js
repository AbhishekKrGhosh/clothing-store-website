import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES || '30d',
  });

async function readUser(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.id);
    return user && user.active ? user : null;
  } catch {
    return null;
  }
}

// Attaches req.user if a valid token is present, never blocks
export async function optionalAuth(req, _res, next) {
  req.user = await readUser(req);
  next();
}

export async function protect(req, res, next) {
  req.user = await readUser(req);
  if (!req.user) return res.status(401).json({ message: 'Please sign in to continue' });
  next();
}

export async function adminOnly(req, res, next) {
  req.user = req.user || (await readUser(req));
  if (!req.user) return res.status(401).json({ message: 'Please sign in to continue' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
}
