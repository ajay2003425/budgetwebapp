import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { Notification } from '../models/Notification';
import { createError } from '../middleware/errorHandler';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';

export const createExpense = async (req: Request, res: Response) => {
  const currentUser = req.user!;
  
  const expense = new Expense({
    ...req.body,
    userId: currentUser._id,
  });

  await expense.save();

  const populatedExpense = await Expense.findById(expense._id)
    .populate('budgetId', 'name departmentId categoryId')
    .populate('userId', 'name email');

  res.status(201).json({
    success: true,
    data: populatedExpense,
  });
};

export const getExpenses = async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const { budgetId, userId, status } = req.query;

  let filter: any = {};

  // Apply filters
  if (budgetId) filter.budgetId = budgetId;
  if (userId) filter.userId = userId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('budgetId', 'name departmentId categoryId')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Expense.countDocuments(filter),
  ]);

  const result = createPaginationResult(expenses, total, page, limit);

  res.json({
    success: true,
    ...result,
  });
};

export const getExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const expense = await Expense.findById(id)
    .populate('budgetId', 'name departmentId categoryId')
    .populate('userId', 'name email')
    .populate('approvedBy', 'name email');

  if (!expense) {
    throw createError('Expense not found', 404);
  }

  // Role-based access control
  const currentUser = req.user!;
  if (currentUser.role === 'USER') {
    if (expense.userId?._id.toString() !== currentUser._id.toString()) {
      throw createError('Access denied', 403);
    }
  }

  res.json({
    success: true,
    data: expense,
  });
};

export const updateExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const expense = await Expense.findById(id);
  if (!expense) {
    throw createError('Expense not found', 404);
  }

  // Can only edit pending expenses
  if (expense.status !== 'PENDING') {
    throw createError('Cannot edit approved or rejected expenses', 400);
  }

  const currentUser = req.user!;
  
  // Users can only edit their own expenses
  if (currentUser.role === 'USER' && expense.userId?.toString() !== currentUser._id.toString()) {
    throw createError('Access denied', 403);
  }

  const updatedExpense = await Expense.findByIdAndUpdate(id, updates, { new: true })
    .populate('budgetId', 'name departmentId categoryId')
    .populate('userId', 'name email');

  res.json({
    success: true,
    data: updatedExpense,
  });
};

export const approveExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get expense and lock it
      const expense = await Expense.findById(id).session(session);
      if (!expense) {
        throw createError('Expense not found', 404);
      }

      if (expense.status !== 'PENDING') {
        throw createError('Expense is not pending approval', 400);
      }

      // Get budget and update spent amount
      const budget = await Budget.findById(expense.budgetId).session(session);
      if (!budget) {
        throw createError('Budget not found', 404);
      }

      // Update expense status
      expense.status = 'APPROVED';
      expense.approvedBy = currentUser._id;
      expense.approvedAt = new Date();
      await expense.save({ session });

      // Update budget spent amount
      budget.spent += expense.amount;
      await budget.save({ session });

      // Create notification
      const notification = new Notification({
        userId: expense.userId,
        title: 'Expense Approved',
        message: `Your expense of $${expense.amount} has been approved.`,
        type: 'INFO',
      });
      await notification.save({ session });
    });

    const updatedExpense = await Expense.findById(id)
      .populate('budgetId', 'name departmentId categoryId')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: updatedExpense,
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

export const rejectExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const currentUser = req.user!;

  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get expense and lock it
      const expense = await Expense.findById(id).session(session);
      if (!expense) {
        throw createError('Expense not found', 404);
      }

      if (expense.status !== 'PENDING') {
        throw createError('Expense is not pending approval', 400);
      }

      // Update expense status
      expense.status = 'REJECTED';
      expense.approvedBy = currentUser._id;
      expense.approvedAt = new Date();
      await expense.save({ session });

      // Create notification
      const notification = new Notification({
        userId: expense.userId,
        title: 'Expense Rejected',
        message: `Your expense of $${expense.amount} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'WARNING',
      });
      await notification.save({ session });
    });

    const updatedExpense = await Expense.findById(id)
      .populate('budgetId', 'name departmentId categoryId')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: updatedExpense,
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};