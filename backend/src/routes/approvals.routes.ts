import { Router } from 'express';
import { z } from 'zod';
import * as approvalController from '../controllers/approvalController';
import { verifyAccess } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication and manager/admin role
router.use(verifyAccess, requireRole('ADMIN', 'MANAGER'));

router.get('/', 
  validate({ query: schemas.pagination }),
  asyncHandler(approvalController.getApprovals)
);

router.post('/:expenseId/approve', 
  validate({ params: z.object({ expenseId: schemas.mongoId }) }),
  asyncHandler(approvalController.approveExpenseById)
);

router.post('/:expenseId/reject', 
  validate({ 
    params: z.object({ expenseId: schemas.mongoId }),
    body: z.object({ reason: z.string().optional() })
  }),
  asyncHandler(approvalController.rejectExpenseById)
);

export { router as approvalsRoutes };