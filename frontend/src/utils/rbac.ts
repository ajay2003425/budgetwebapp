import { User } from '../types';

export const hasRole = (user: User | null, roles: string | string[]): boolean => {
  if (!user) return false;
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
};

export const canManageUsers = (user: User | null): boolean => {
  return hasRole(user, ['ADMIN', 'MANAGER']);
};

export const canCreateBudgets = (user: User | null): boolean => {
  return hasRole(user, ['ADMIN', 'MANAGER']);
};

export const canApproveExpenses = (user: User | null): boolean => {
  return hasRole(user, ['ADMIN', 'MANAGER']);
};

export const canManageDepartments = (user: User | null): boolean => {
  return hasRole(user, 'ADMIN');
};

export const canManageCategories = (user: User | null): boolean => {
  return hasRole(user, 'ADMIN');
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'ADMIN');
};

export const isManager = (user: User | null): boolean => {
  return hasRole(user, 'MANAGER');
};

export const isUser = (user: User | null): boolean => {
  return hasRole(user, 'USER');
};