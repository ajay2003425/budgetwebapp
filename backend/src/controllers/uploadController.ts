import { Request, Response } from 'express';
import { createError } from '../middleware/errorHandler';

export const uploadReceipt = async (req: Request, res: Response) => {
  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  const fileUrl = `/uploads/receipts/${req.file.filename}`;

  res.json({
    success: true,
    url: fileUrl,
  });
};