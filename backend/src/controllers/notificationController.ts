import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { createError } from '../middleware/errorHandler';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';

export const getNotifications = async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = getPaginationOptions(req.query);
  const { read } = req.query;
  const currentUser = req.user!;

  let filter: any = { userId: currentUser._id };

  // Filter by read status if provided
  if (read !== undefined) {
    filter.read = read === 'true';
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: notifications,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
};

export const markAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: currentUser._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw createError('Notification not found', 404);
  }

  res.json({
    success: true,
    data: notification,
  });
};

export const markAllAsRead = async (req: Request, res: Response) => {
  const currentUser = req.user!;

  await Notification.updateMany(
    { userId: currentUser._id, read: false },
    { read: true }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
};

export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    userId: currentUser._id,
  });

  if (!notification) {
    throw createError('Notification not found', 404);
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully',
  });
};

export const getUnreadCount = async (req: Request, res: Response) => {
  const currentUser = req.user!;

  const unreadCount = await Notification.countDocuments({
    userId: currentUser._id,
    read: false,
  });

  res.json({
    success: true,
    data: { unreadCount },
  });
};

export const createTestNotification = async (req: Request, res: Response) => {
  const currentUser = req.user!;

  const testNotification = new Notification({
    userId: currentUser._id,
    title: 'Test Notification',
    message: 'This is a test notification to verify the notification system is working.',
    type: 'INFO',
  });

  await testNotification.save();

  res.json({
    success: true,
    data: testNotification,
    message: 'Test notification created successfully',
  });
};
