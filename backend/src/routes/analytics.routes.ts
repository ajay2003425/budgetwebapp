import { Router } from 'express';
import { z } from 'zod';
import * as analyticsController from '../controllers/analyticsController';
import { verifyAccess } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess);

const periodSchema = z.object({
  period: z.enum(['month', 'quarter', 'year']).optional(),
});

const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

router.get('/overview', 
  validate({ query: periodSchema }),
  asyncHandler(analyticsController.getOverview)
);

router.get('/trends', 
  validate({ query: dateRangeSchema }),
  asyncHandler(analyticsController.getTrends)
);

router.get('/by-department', 
  asyncHandler(analyticsController.getByDepartment)
);

router.get('/by-category', 
  asyncHandler(analyticsController.getByCategory)
);

export { router as analyticsRoutes };