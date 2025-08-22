export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  departmentId?: string | Department;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  name: string;
  departmentId: Department;
  categoryId: Category;
  ownerId: User;
  amount: number;
  spent: number;
  remaining: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  budgetId: Budget;
  userId: User;
  amount: number;
  description: string;
  receiptUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: User;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ACTION';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface OverviewData {
  totalBudgets: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  pendingApprovals: number;
  unreadNotifications: number;
}

export interface TrendData {
  series: Array<{
    date: string;
    spent: number;
  }>;
}

export interface BreakdownData {
  departmentId?: string;
  departmentName?: string;
  categoryId?: string;
  categoryName?: string;
  allocated: number;
  spent: number;
}