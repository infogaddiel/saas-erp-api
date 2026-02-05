import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, message: 'Invalid authorization format' });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, secret) as any;
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (!payload || !payload.id) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach user to request
    (req as any).user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

export default authenticate;
