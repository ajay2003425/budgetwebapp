import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

export const scopeDepartment = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Admin can access all departments
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // Manager and User are scoped to their department
  if (req.user.role === 'MANAGER' || req.user.role === 'USER') {
    if (!req.user.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Department assignment required',
      });
    }
    
    req.departmentId = req.user.departmentId.toString();
  }

  next();
};