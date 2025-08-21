import { config } from 'dotenv';

config();

export const env = {
  PORT: process.env.PORT || 4000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/budgetx',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  ACCESS_EXPIRES_IN: process.env.ACCESS_EXPIRES_IN || '15m',
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};