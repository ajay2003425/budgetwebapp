import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController';
import { verifyAccess, verifyRefresh } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: schemas.email,
  password: schemas.password,
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  departmentId: schemas.mongoId.optional(),
});

const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1, 'Password is required'),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: schemas.password,
});

// Wrap controllers in async handler
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/register', 
  authRateLimit,
  validate({ body: registerSchema }), 
  asyncHandler(authController.register)
);

router.post('/login', 
  authRateLimit,
  validate({ body: loginSchema }), 
  asyncHandler(authController.login)
);

router.post('/refresh', 
  verifyRefresh, 
  asyncHandler(authController.refresh)
);

router.post('/logout', 
  asyncHandler(authController.logout)
);

router.get('/me', 
  verifyAccess, 
  asyncHandler(authController.me)
);

export { router as authRoutes };