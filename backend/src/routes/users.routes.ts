import { Router } from 'express';
import { z } from 'zod';
import * as userController from '../controllers/userController';
import { verifyAccess } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: schemas.email.optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  departmentId: schemas.mongoId.optional(),
  isActive: z.boolean().optional(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: schemas.password,
});

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess);

router.get('/', 
  requireRole('ADMIN', 'MANAGER'),
  validate({ query: schemas.pagination }),
  asyncHandler(userController.getUsers)
);

router.get('/:id', 
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(userController.getUser)
);

router.patch('/:id', 
  validate({ 
    params: z.object({ id: schemas.mongoId }),
    body: updateUserSchema
  }),
  asyncHandler(userController.updateUser)
);

router.patch('/:id/activate', 
  requireRole('ADMIN'),
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(userController.activateUser)
);

router.patch('/:id/deactivate', 
  requireRole('ADMIN'),
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(userController.deactivateUser)
);

router.patch('/:id/password', 
  validate({ 
    params: z.object({ id: schemas.mongoId }),
    body: passwordChangeSchema
  }),
  asyncHandler(userController.changePassword)
);

export { router as usersRoutes };