import { Request, Response } from 'express';
import { User } from '../models/User';
import { hashPassword } from '../utils/passwords';
import { createError } from '../middleware/errorHandler';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';

export const getUsers = async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const { role } = req.query;

  console.log('getUsers called with query params:', req.query);
  console.log('Extracted role filter:', role);
  console.log('Current user role:', req.user!.role);

  let filter: any = {};

  // Role-based filtering
  if (req.user!.role === 'MANAGER') {
    if (!req.user!.departmentId) {
      throw createError('Department assignment required', 403);
    }
    filter.departmentId = req.user!.departmentId;
  }

  if (role) {
    filter.role = role;
  }

  console.log('Final filter object:', filter);

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .populate('departmentId', 'name code')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  console.log('Found users count:', users.length);
  console.log('Total users matching filter:', total);

  const result = createPaginationResult(users, total, page, limit);

  res.json({
    success: true,
    ...result,
  });
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const user = await User.findById(id)
    .select('-passwordHash')
    .populate('departmentId', 'name code');

  if (!user) {
    throw createError('User not found', 404);
  }

  // Role-based access control
  const currentUser = req.user!;
  if (currentUser.role === 'USER' && currentUser._id.toString() !== id) {
    throw createError('Access denied', 403);
  }

  if (currentUser.role === 'MANAGER') {
    if (currentUser._id.toString() !== id && 
        user.departmentId?.toString() !== currentUser.departmentId?.toString()) {
      throw createError('Access denied', 403);
    }
  }

  res.json({
    success: true,
    data: user,
  });
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw createError('User not found', 404);
  }

  const currentUser = req.user!;

  // Role-based update permissions
  if (currentUser.role === 'USER' && currentUser._id.toString() !== id) {
    throw createError('Access denied', 403);
  }

  if (currentUser.role === 'MANAGER') {
    if (currentUser._id.toString() !== id && 
        user.departmentId?.toString() !== currentUser.departmentId?.toString()) {
      throw createError('Access denied', 403);
    }
    
    // Managers can only update limited fields
    const allowedFields = ['name', 'isActive'];
    Object.keys(updates).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete updates[key];
      }
    });
  }

  // Users can only update their own name and email
  if (currentUser.role === 'USER') {
    const allowedFields = ['name', 'email'];
    Object.keys(updates).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete updates[key];
      }
    });
  }

  const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })
    .select('-passwordHash')
    .populate('departmentId', 'name code');

  res.json({
    success: true,
    data: updatedUser,
  });
};

export const activateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  ).select('-passwordHash');

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
  });
};

export const deactivateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).select('-passwordHash');

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
  });
};

export const changePassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  const currentUser = req.user!;
  
  // Users can only change their own password
  if (currentUser._id.toString() !== id) {
    throw createError('Access denied', 403);
  }

  const user = await User.findById(id);
  if (!user) {
    throw createError('User not found', 404);
  }

  const isValidPassword = await user.comparePassword(currentPassword);
  if (!isValidPassword) {
    throw createError('Current password is incorrect', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await User.findByIdAndUpdate(id, { passwordHash });

  res.json({
    success: true,
  });
};