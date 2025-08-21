import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import { verifyAccess } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadRateLimit } from '../middleware/rateLimit';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess, uploadRateLimit);

router.post('/receipt', 
  upload.single('receipt'), 
  asyncHandler(uploadController.uploadReceipt)
);

export { router as uploadsRoutes };