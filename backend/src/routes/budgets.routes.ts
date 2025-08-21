import { Router } from 'express';
import { z } from 'zod';
import * as budgetController from '../controllers/budgetController';
import { verifyAccess } from '../middleware/auth';
import { requireRole, scopeDepartment } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

const budgetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  departmentId: schemas.mongoId,
  categoryId: schemas.mongoId,
  ownerId: schemas.mongoId.optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess);

router.post('/', 
  requireRole('ADMIN', 'MANAGER'),
  validate({ body: budgetSchema }),
  asyncHandler(budgetController.createBudget)
);

router.get('/', 
  scopeDepartment,
  validate({ query: schemas.pagination }),
  asyncHandler(budgetController.getBudgets)
);

router.get('/:id', 
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(budgetController.getBudget)
);

router.patch('/:id', 
  requireRole('ADMIN', 'MANAGER'),
  validate({ 
    params: z.object({ id: schemas.mongoId }),
    body: budgetSchema.partial()
  }),
  asyncHandler(budgetController.updateBudget)
);

router.delete('/:id', 
  requireRole('ADMIN'),
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(budgetController.deleteBudget)
);

export { router as budgetsRoutes };