import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Budget } from '../models/Budget';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';
import { notifyBudgetCreated } from '../utils/notifications';

export const createBudget = async (req: Request, res: Response) => {
  const currentUser = req.user!;
  
  // Manager can only create budgets for their department
  if (currentUser.role === 'MANAGER') {
    req.body.departmentId = currentUser.departmentId;
  }

  // Set owner to current user if not provided
  if (!req.body.ownerId) {
    req.body.ownerId = currentUser._id;
  }

  const budget = new Budget(req.body);
  await budget.save();

  const populatedBudget = await Budget.findById(budget._id)
    .populate('departmentId', 'name code')
    .populate('categoryId', 'name')
    .populate('ownerId', 'name email');

  // Notify department users about new budget
  try {
    const departmentUsers = await User.find({
      departmentId: budget.departmentId,
      _id: { $ne: currentUser._id }, // Don't notify the creator
      isActive: true
    });

    for (const user of departmentUsers) {
      await notifyBudgetCreated(
        user._id as mongoose.Types.ObjectId,
        budget.name,
        budget.amount
      );
    }
  } catch (notificationError) {
    console.error('Failed to send budget creation notifications:', notificationError);
  }

  res.status(201).json({
    success: true,
    data: populatedBudget,
  });
};

export const getBudgets = async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const { departmentId, categoryId, status, search } = req.query;

  let filter: any = {};

  // Role-based filtering
  const currentUser = req.user!;
  if (currentUser.role === 'MANAGER') {
    filter.departmentId = currentUser.departmentId;
  } else if (currentUser.role === 'USER') {
    filter.$or = [
      { ownerId: currentUser._id },
      { departmentId: currentUser.departmentId },
    ];
  }

  // Apply additional filters
  if (departmentId) filter.departmentId = departmentId;
  if (categoryId) filter.categoryId = categoryId;
  if (status) filter.status = status;
  
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [budgets, total] = await Promise.all([
    Budget.find(filter)
      .populate('departmentId', 'name code')
      .populate('categoryId', 'name')
      .populate('ownerId', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Budget.countDocuments(filter),
  ]);

  const result = createPaginationResult(budgets, total, page, limit);

  res.json({
    success: true,
    ...result,
  });
};

export const getBudget = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const budget = await Budget.findById(id)
    .populate('departmentId', 'name code')
    .populate('categoryId', 'name')
    .populate('ownerId', 'name email');

  if (!budget) {
    throw createError('Budget not found', 404);
  }

  // Role-based access control
  const currentUser = req.user!;
  if (currentUser.role === 'MANAGER') {
    if (budget.departmentId?._id.toString() !== currentUser.departmentId?.toString()) {
      throw createError('Access denied', 403);
    }
  } else if (currentUser.role === 'USER') {
    const hasAccess = 
      budget.ownerId?._id.toString() === currentUser._id.toString() ||
      budget.departmentId?._id.toString() === currentUser.departmentId?.toString();
    
    if (!hasAccess) {
      throw createError('Access denied', 403);
    }
  }

  res.json({
    success: true,
    data: budget,
  });
};

export const updateBudget = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const budget = await Budget.findById(id);
  if (!budget) {
    throw createError('Budget not found', 404);
  }

  // Role-based access control
  const currentUser = req.user!;
  if (currentUser.role === 'MANAGER') {
    if (budget.departmentId?.toString() !== currentUser.departmentId?.toString()) {
      throw createError('Access denied', 403);
    }
  }

  // Cannot reduce amount below spent
  if (updates.amount !== undefined && updates.amount < budget.spent) {
    throw createError('Budget amount cannot be less than already spent amount', 400);
  }

  const updatedBudget = await Budget.findByIdAndUpdate(id, updates, { new: true })
    .populate('departmentId', 'name code')
    .populate('categoryId', 'name')
    .populate('ownerId', 'name email');

  res.json({
    success: true,
    data: updatedBudget,
  });
};

export const deleteBudget = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Archive instead of delete
  const budget = await Budget.findByIdAndUpdate(
    id,
    { status: 'ARCHIVED' },
    { new: true }
  );

  if (!budget) {
    throw createError('Budget not found', 404);
  }

  res.json({
    success: true,
  });
};