import { Request, Response } from 'express';
import { User } from '../models/User';
import { hashPassword } from '../utils/passwords';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import { createError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, departmentId } = req.body;

  // Check if user is admin to create other roles
  if (req.user && req.user.role !== 'ADMIN' && role !== 'USER') {
    throw createError('Only admins can create non-user accounts', 403);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('Email already registered', 400);
  }

  const passwordHash = await hashPassword(password);

  const user = new User({
    name,
    email,
    passwordHash,
    role: role || 'USER',
    departmentId,
  });

  await user.save();

  const safeUser = User.safeUser(user);

  res.status(201).json({
    success: true,
    user: safeUser,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    throw createError('Invalid credentials', 401);
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set refresh token as HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const safeUser = User.safeUser(user);

  res.json({
    success: true,
    accessToken,
    user: safeUser,
  });
};

export const refresh = async (req: Request, res: Response) => {
  const user = req.user!;
  const accessToken = generateAccessToken(user);

  res.json({
    success: true,
    accessToken,
  });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  
  res.json({
    success: true,
  });
};

export const me = async (req: Request, res: Response) => {
  const user = req.user!;
  const safeUser = User.safeUser(user);

  res.json({
    success: true,
    user: safeUser,
  });
};