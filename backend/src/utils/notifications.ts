import { Notification } from '../models/Notification';
import { User } from '../models/User';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'ACTION';
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = new Notification({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'INFO',
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

// Specific notification helpers
export const notifyExpenseApproved = async (
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  budgetName: string
) => {
  return createNotification({
    userId,
    title: 'Expense Approved',
    message: `Your expense of $${amount} for ${budgetName} has been approved.`,
    type: 'INFO',
  });
};

export const notifyExpenseRejected = async (
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  budgetName: string,
  reason?: string
) => {
  return createNotification({
    userId,
    title: 'Expense Rejected',
    message: `Your expense of $${amount} for ${budgetName} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
    type: 'WARNING',
  });
};

export const notifyBudgetCreated = async (
  userId: string | mongoose.Types.ObjectId,
  budgetName: string,
  amount: number
) => {
  return createNotification({
    userId,
    title: 'New Budget Created',
    message: `A new budget "${budgetName}" with $${amount} has been created for your department.`,
    type: 'INFO',
  });
};

export const notifyBudgetLimitWarning = async (
  userId: string | mongoose.Types.ObjectId,
  budgetName: string,
  percentage: number
) => {
  return createNotification({
    userId,
    title: 'Budget Limit Warning',
    message: `Budget "${budgetName}" has reached ${percentage}% of its limit. Please monitor your spending.`,
    type: 'WARNING',
  });
};

export const notifyUserRoleChanged = async (
  userId: string | mongoose.Types.ObjectId,
  newRole: string
) => {
  return createNotification({
    userId,
    title: 'Role Updated',
    message: `Your role has been updated to ${newRole}.`,
    type: 'INFO',
  });
};

export const notifyPendingApproval = async (
  managerId: string | mongoose.Types.ObjectId,
  userName: string,
  amount: number,
  description: string
) => {
  return createNotification({
    userId: managerId,
    title: 'Expense Awaiting Approval',
    message: `${userName} submitted an expense of $${amount} for "${description}" that requires your approval.`,
    type: 'ACTION',
  });
};
