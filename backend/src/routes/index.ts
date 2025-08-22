import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';
import { departmentsRoutes } from './departments.routes';
import { categoriesRoutes } from './categories.routes';
import { budgetsRoutes } from './budgets.routes';
import { expensesRoutes } from './expenses.routes';
import { approvalsRoutes } from './approvals.routes';
import { analyticsRoutes } from './analytics.routes';
import { uploadsRoutes } from './uploads.routes';
import { notificationsRoutes } from './notifications.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/budgets', budgetsRoutes);
router.use('/expenses', expensesRoutes);
router.use('/approvals', approvalsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/notifications', notificationsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

export { router as routes };