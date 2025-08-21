import { Router } from 'express';
import { z } from 'zod';
import * as categoryController from '../controllers/categoryController';
import { verifyAccess } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess);

router.post('/', 
  requireRole('ADMIN'),
  validate({ body: categorySchema }),
  asyncHandler(categoryController.createCategory)
);

router.get('/', 
  validate({ query: schemas.pagination }),
  asyncHandler(categoryController.getCategories)
);

router.get('/:id', 
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(categoryController.getCategory)
);

router.patch('/:id', 
  requireRole('ADMIN'),
  validate({ 
    params: z.object({ id: schemas.mongoId }),
    body: categorySchema.partial()
  }),
  asyncHandler(categoryController.updateCategory)
);

router.delete('/:id', 
  requireRole('ADMIN'),
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(categoryController.deleteCategory)
);

export { router as categoriesRoutes };