import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';
import { notifyExpenseApproved, notifyExpenseRejected, notifyPendingApproval } from '../utils/notifications';

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

  // Notify managers about pending approval
  try {
    // Find managers in the same department or admins
    const budget = await Budget.findById(expense.budgetId).populate('departmentId');
    if (budget) {
      const managers = await User.find({
        $or: [
          { role: 'ADMIN' },
          { role: 'MANAGER', departmentId: (budget as any).departmentId._id }
        ]
      });

      // Create notifications for managers
      for (const manager of managers) {
        await notifyPendingApproval(
          manager._id,
          currentUser.name,
          expense.amount,
          expense.description
        );
      }
    }
  } catch (notificationError) {
    console.error('Failed to send approval notifications:', notificationError);
    // Don't fail the request if notifications fail
  }

  res.status(201).json({
    success: true,
    data: populatedExpense,
  });
};

export const getExpenses = async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const { budgetId, userId, status } = req.query;
  const currentUser = req.user!;

  let filter: any = {};

  // Apply role-based filtering
  if (currentUser.role === 'USER') {
    // Regular users can only see their own expenses
    filter.userId = currentUser._id;
  } else if (currentUser.role === 'MANAGER') {
    // Managers can see expenses from their department's budgets
    const departmentBudgets = await Budget.find({ 
      departmentId: currentUser.departmentId 
    }).select('_id');
    
    const budgetIds = departmentBudgets.map((budget: any) => budget._id);
    
    if (budgetId) {
      // If specific budget filter is applied, make sure it's from manager's department
      if (budgetIds.some((id: any) => id.toString() === budgetId)) {
        filter.budgetId = budgetId;
      } else {
        // Budget is not from manager's department, return empty result
        filter.budgetId = { $in: [] }; // This will match no documents
      }
    } else {
      filter.budgetId = { $in: budgetIds };
    }
  } else {
    // ADMINs can see all expenses, apply filters normally
    if (budgetId) filter.budgetId = budgetId;
  }

  // Apply additional filters (these work for all roles)
  if (userId && currentUser.role !== 'USER') { // Users can only see their own expenses
    filter.userId = userId;
  }
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

    // Create notification using helper function
    try {
      await notifyExpenseApproved(
        expense.userId,
        expense.amount,
        budget.name
      );
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
    }

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

    // Create notification using helper function
    try {
      const budget = await Budget.findById(expense.budgetId);
      await notifyExpenseRejected(
        expense.userId,
        expense.amount,
        budget?.name || 'Unknown Budget',
        reason
      );
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
    }

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