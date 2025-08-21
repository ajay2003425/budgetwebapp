import { Router } from 'express';
import { z } from 'zod';
import * as departmentController from '../controllers/departmentController';
import { verifyAccess } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

const departmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  description: z.string().optional(),
});

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess);

router.post('/', 
  requireRole('ADMIN'),
  validate({ body: departmentSchema }),
  asyncHandler(departmentController.createDepartment)
);

router.get('/', 
  validate({ query: schemas.pagination }),
  asyncHandler(departmentController.getDepartments)
);

router.get('/:id', 
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(departmentController.getDepartment)
);

router.patch('/:id', 
  requireRole('ADMIN'),
  validate({ 
    params: z.object({ id: schemas.mongoId }),
    body: departmentSchema.partial()
  }),
  asyncHandler(departmentController.updateDepartment)
);

router.delete('/:id', 
  requireRole('ADMIN'),
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(departmentController.deleteDepartment)
);

export { router as departmentsRoutes };