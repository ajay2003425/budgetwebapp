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
  const { id, expenseId } = req.params;
  const expenseIdToUse = expenseId || id; // Handle both route patterns
  const currentUser = req.user!;

  try {
    // Atomically update the expense status from PENDING to APPROVED
    const expense = await Expense.findOneAndUpdate(
      { _id: expenseIdToUse, status: 'PENDING' },
      { 
        status: 'APPROVED',
        approvedBy: currentUser._id,
        approvedAt: new Date()
      },
      { new: false } // Return the original document to check if it was pending
    );

    if (!expense) {
      // Either expense doesn't exist or it's not in PENDING status
      const existingExpense = await Expense.findById(expenseIdToUse);
      if (!existingExpense) {
        throw createError('Expense not found', 404);
      }
      if (existingExpense.status === 'APPROVED') {
        // Return success if already approved (idempotent)
        return res.json({
          success: true,
          message: 'Expense was already approved',
          data: existingExpense,
        });
      }
      throw createError('Expense is not pending approval', 400);
    }

    // Get budget and update spent amount
    const budget = await Budget.findById(expense.budgetId);
    if (!budget) {
      throw createError('Budget not found', 404);
    }

    // Update budget spent amount
    budget.spent = (budget.spent || 0) + expense.amount;
    await budget.save();

    // Create notification
    const notification = new Notification({
      userId: expense.userId,
      title: 'Expense Approved',
      message: `Your expense of $${expense.amount} has been approved.`,
      type: 'INFO',
    });
    await notification.save();

    // Fetch the updated expense with populated fields
    const updatedExpense = await Expense.findById(expenseIdToUse)
      .populate('budgetId', 'name departmentId categoryId')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: updatedExpense,
    });
  } catch (error) {
    throw error;
  }
};

export const rejectExpense = async (req: Request, res: Response) => {
  const { id, expenseId } = req.params;
  const expenseIdToUse = expenseId || id; // Handle both route patterns
  const { reason } = req.body;
  const currentUser = req.user!;

  try {
    // Atomically update the expense status from PENDING to REJECTED
    const expense = await Expense.findOneAndUpdate(
      { _id: expenseIdToUse, status: 'PENDING' },
      { 
        status: 'REJECTED',
        approvedBy: currentUser._id,
        approvedAt: new Date()
      },
      { new: false } // Return the original document to check if it was pending
    );

    if (!expense) {
      // Either expense doesn't exist or it's not in PENDING status
      const existingExpense = await Expense.findById(expenseIdToUse);
      if (!existingExpense) {
        throw createError('Expense not found', 404);
      }
      if (existingExpense.status === 'REJECTED') {
        // Return success if already rejected (idempotent)
        return res.json({
          success: true,
          message: 'Expense was already rejected',
          data: existingExpense,
        });
      }
      throw createError('Expense is not pending approval', 400);
    }

    // Create notification
    const notification = new Notification({
      userId: expense.userId,
      title: 'Expense Rejected',
      message: `Your expense of $${expense.amount} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'WARNING',
    });
    await notification.save();

    // Fetch the updated expense with populated fields
    const updatedExpense = await Expense.findById(expenseIdToUse)
      .populate('budgetId', 'name departmentId categoryId')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: updatedExpense,
    });
  } catch (error) {
    throw error;
  }
};