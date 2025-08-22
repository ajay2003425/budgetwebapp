import { Router } from 'express';
import { z } from 'zod';
import * as notificationController from '../controllers/notificationController';
import { verifyAccess } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require authentication
router.use(verifyAccess);

router.get('/', 
  validate({ query: schemas.pagination.extend({ read: z.string().optional() }) }),
  asyncHandler(notificationController.getNotifications)
);

router.get('/unread-count', 
  asyncHandler(notificationController.getUnreadCount)
);

// Test endpoint - remove in production
router.post('/test', 
  asyncHandler(notificationController.createTestNotification)
);

router.patch('/:id/read', 
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(notificationController.markAsRead)
);

router.patch('/mark-all-read', 
  asyncHandler(notificationController.markAllAsRead)
);

router.delete('/:id', 
  validate({ params: z.object({ id: schemas.mongoId }) }),
  asyncHandler(notificationController.deleteNotification)
);

export { router as notificationsRoutes };
