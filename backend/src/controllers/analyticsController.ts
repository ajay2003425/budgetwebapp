import { Request, Response } from 'express';
import { Budget } from '../models/Budget';
import { Expense } from '../models/Expense';
import { Notification } from '../models/Notification';
import { getDateRange } from '../utils/date';

export const getOverview = async (req: Request, res: Response) => {
  const { period = 'month' } = req.query;
  const currentUser = req.user!;
  const { startDate, endDate } = getDateRange(period as string);

  let budgetFilter: any = { status: 'ACTIVE' };
  let expenseFilter: any = { 
    status: 'APPROVED',
    approvedAt: { $gte: startDate, $lte: endDate }
  };

  // Role-based filtering
  if (currentUser.role === 'MANAGER') {
    budgetFilter.departmentId = currentUser.departmentId;
    
    // Get budget IDs for expense filtering
    const budgets = await Budget.find(budgetFilter).select('_id');
    const budgetIds = budgets.map(b => b._id);
    expenseFilter.budgetId = { $in: budgetIds };
  } else if (currentUser.role === 'USER') {
    budgetFilter.$or = [
      { ownerId: currentUser._id },
      { departmentId: currentUser.departmentId },
    ];
    
    const budgets = await Budget.find(budgetFilter).select('_id');
    const budgetIds = budgets.map(b => b._id);
    expenseFilter.budgetId = { $in: budgetIds };
  }

  const [
    budgetStats,
    expenseStats,
    pendingApprovals,
    unreadNotifications
  ] = await Promise.all([
    Budget.aggregate([
      { $match: budgetFilter },
      {
        $group: {
          _id: null,
          totalBudgets: { $sum: 1 },
          totalAllocated: { $sum: '$amount' },
          totalSpent: { $sum: '$spent' },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    Expense.countDocuments({ 
      status: 'PENDING',
      ...(currentUser.role !== 'ADMIN' ? expenseFilter : {}),
    }),
    Notification.countDocuments({ 
      userId: currentUser._id,
      read: false 
    }),
  ]);

  const budget = budgetStats[0] || { totalBudgets: 0, totalAllocated: 0, totalSpent: 0 };
  const expense = expenseStats[0] || { totalExpenses: 0, totalAmount: 0 };

  res.json({
    success: true,
    data: {
      totalBudgets: budget.totalBudgets,
      totalAllocated: budget.totalAllocated,
      totalSpent: budget.totalSpent,
      totalRemaining: budget.totalAllocated - budget.totalSpent,
      pendingApprovals,
      unreadNotifications,
    },
  });
};

export const getTrends = async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const currentUser = req.user!;

  const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = to ? new Date(to as string) : new Date();

  let matchFilter: any = {
    status: 'APPROVED',
    approvedAt: { $gte: startDate, $lte: endDate }
  };

  // Role-based filtering
  if (currentUser.role !== 'ADMIN') {
    let budgetFilter: any = {};
    
    if (currentUser.role === 'MANAGER') {
      budgetFilter.departmentId = currentUser.departmentId;
    } else if (currentUser.role === 'USER') {
      budgetFilter.$or = [
        { ownerId: currentUser._id },
        { departmentId: currentUser.departmentId },
      ];
    }

    const budgets = await Budget.find(budgetFilter).select('_id');
    const budgetIds = budgets.map(b => b._id);
    matchFilter.budgetId = { $in: budgetIds };
  }

  const trends = await Expense.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$approvedAt'
          }
        },
        spent: { $sum: '$amount' }
      }
    },
    { $sort: { '_id': 1 } },
    {
      $project: {
        date: '$_id',
        spent: 1,
        _id: 0
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      series: trends,
    },
  });
};

export const getByDepartment = async (req: Request, res: Response) => {
  const currentUser = req.user!;
  
  let budgetFilter: any = { status: 'ACTIVE' };

  // Role-based filtering
  if (currentUser.role === 'MANAGER') {
    budgetFilter.departmentId = currentUser.departmentId;
  } else if (currentUser.role === 'USER') {
    budgetFilter.$or = [
      { ownerId: currentUser._id },
      { departmentId: currentUser.departmentId },
    ];
  }

  const breakdown = await Budget.aggregate([
    { $match: budgetFilter },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'department'
      }
    },
    { $unwind: '$department' },
    {
      $group: {
        _id: '$departmentId',
        departmentName: { $first: '$department.name' },
        allocated: { $sum: '$amount' },
        spent: { $sum: '$spent' }
      }
    },
    {
      $project: {
        departmentId: '$_id',
        departmentName: 1,
        allocated: 1,
        spent: 1,
        _id: 0
      }
    }
  ]);

  res.json({
    success: true,
    data: breakdown,
  });
};

export const getByCategory = async (req: Request, res: Response) => {
  const currentUser = req.user!;
  
  let budgetFilter: any = { status: 'ACTIVE' };

  // Role-based filtering
  if (currentUser.role === 'MANAGER') {
    budgetFilter.departmentId = currentUser.departmentId;
  } else if (currentUser.role === 'USER') {
    budgetFilter.$or = [
      { ownerId: currentUser._id },
      { departmentId: currentUser.departmentId },
    ];
  }

  const breakdown = await Budget.aggregate([
    { $match: budgetFilter },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$categoryId',
        categoryName: { $first: '$category.name' },
        allocated: { $sum: '$amount' },
        spent: { $sum: '$spent' }
      }
    },
    {
      $project: {
        categoryId: '$_id',
        categoryName: 1,
        allocated: 1,
        spent: 1,
        _id: 0
      }
    }
  ]);

  res.json({
    success: true,
    data: breakdown,
  });
};