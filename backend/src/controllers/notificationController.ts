import { Response } from 'express';
import logger from '../config/logger';
import { getDbService } from '../services/dbServiceFactory';
import { AuthenticatedRequest } from '../types';

const getUserNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
        const notifications = await getDbService(req).getUserNotifications(userId, page, limit);
        res.json({ success: true, data: notifications, pagination: { page, limit } });
    } catch (error) {
        const err = error as Error;
        logger.error('Error getting notifications', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const count = await getDbService(req).getUnreadNotificationCount(userId);
        res.json({ success: true, data: { count } });
    } catch (error) {
        const err = error as Error;
        logger.error('Error getting unread notification count', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const notificationId = parseInt(req.params.id as string, 10);
        if (isNaN(notificationId) || notificationId < 1) {
            res.status(400).json({ success: false, message: '无效的通知ID' });
            return;
        }

        const marked = await getDbService(req).markNotificationRead(userId, notificationId);
        if (!marked) {
            res.status(404).json({ success: false, message: '未找到通知' });
            return;
        }
        res.json({ success: true, message: '标记已读成功' });
    } catch (error) {
        const err = error as Error;
        logger.error('Error marking notification as read', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const count = await getDbService(req).markAllNotificationsRead(userId);
        res.json({ success: true, message: '全部标记已读成功', data: { count } });
    } catch (error) {
        const err = error as Error;
        logger.error('Error marking all notifications as read', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const notificationId = parseInt(req.params.id as string, 10);
        if (isNaN(notificationId) || notificationId < 1) {
            res.status(400).json({ success: false, message: '无效的通知ID' });
            return;
        }

        const deleted = await getDbService(req).deleteNotification(userId, notificationId);
        if (!deleted) {
            res.status(404).json({ success: false, message: '未找到通知' });
            return;
        }
        res.json({ success: true, message: '删除通知成功' });
    } catch (error) {
        const err = error as Error;
        logger.error('Error deleting notification', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

export {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
