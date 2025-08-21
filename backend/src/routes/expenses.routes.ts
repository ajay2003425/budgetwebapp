import { Router } from 'express';
import { z } from 'zod';
import * as expenseController from '../controllers/expenseController';
import { verifyAccess } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

const expenseSchema = z.object({
  budgetId: schemas.mongoId,
  amount: z.number().min(0.01, 'Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  receiptUrl: z.string().optional(),
});

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess);

router.post('/', 
  validate({ body: expenseSchema }),
  asyncHandler(expenseController.createExpense)
);

router.get('/', 
  validate({ query: schemas.pagination }),
  asyncHandler(expenseController.getExpenses)
);

router.get('/:id', 
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(expenseController.getExpense)
);

router.patch('/:id', 
  validate({ 
    params: z.object({ id: schemas.mongoId }),
    body: expenseSchema.partial()
  }),
  asyncHandler(expenseController.updateExpense)
);

router.patch('/:id/approve', 
  requireRole('ADMIN', 'MANAGER'),
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(expenseController.approveExpense)
);

router.patch('/:id/reject', 
  requireRole('ADMIN', 'MANAGER'),
  validate({ 
    params: z.object({ id: schemas.mongoId }),
    body: z.object({ reason: z.string().optional() })
  }),
  asyncHandler(expenseController.rejectExpense)
);

export { router as expensesRoutes };