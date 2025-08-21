import { Request, Response } from 'express';
import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';
import { approveExpense, rejectExpense } from './expenseController';

export const getApprovals = async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);
  const currentUser = req.user!;

  let budgetFilter: any = {};

  // Manager can only see expenses from their department
  if (currentUser.role === 'MANAGER') {
    budgetFilter.departmentId = currentUser.departmentId;
  }

  // Get budget IDs within scope
  const budgets = await Budget.find(budgetFilter).select('_id');
  const budgetIds = budgets.map(b => b._id);

  const filter = {
    status: 'PENDING',
    budgetId: { $in: budgetIds },
  };

  const skip = (page - 1) * limit;
  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('budgetId', 'name departmentId categoryId')
      .populate('userId', 'name email')
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

export const approveExpenseById = async (req: Request, res: Response) => {
  return approveExpense(req, res);
};

export const rejectExpenseById = async (req: Request, res: Response) => {
  return rejectExpense(req, res);
};