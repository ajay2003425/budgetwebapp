import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUser } from '../models/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, String(env.JWT_ACCESS_SECRET), {
    expiresIn: env.ACCESS_EXPIRES_IN,
    algorithm: 'HS256'
  } as any);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, String(env.JWT_REFRESH_SECRET), {
    expiresIn: env.REFRESH_EXPIRES_IN,
    algorithm: 'HS256'
  } as any);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};