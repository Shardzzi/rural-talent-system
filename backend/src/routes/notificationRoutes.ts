import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notificationController';

const router: Router = express.Router();

router.get('/notifications', authenticateToken, getUserNotifications);
router.get('/notifications/unread-count', authenticateToken, getUnreadCount);
router.put('/notifications/:id/read', authenticateToken, markAsRead);
router.put('/notifications/read-all', authenticateToken, markAllAsRead);
router.delete('/notifications/:id', authenticateToken, deleteNotification);

export default router;
