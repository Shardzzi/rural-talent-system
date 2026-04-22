import { Response } from 'express';
import logger from '../config/logger';
import { getDbService } from '../services/dbServiceFactory';
import { AuthenticatedRequest } from '../types';

const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ success: false, message: '需要管理员权限' });
            return;
        }

        const filters = {
            action: req.query.action as string | undefined,
            resource_type: req.query.resource_type as string | undefined,
            user_id: req.query.user_id ? parseInt(req.query.user_id as string, 10) : undefined,
            date_from: req.query.date_from as string | undefined,
            date_to: req.query.date_to as string | undefined,
            page: parseInt(req.query.page as string, 10) || 1,
            limit: Math.min(parseInt(req.query.limit as string, 10) || 20, 100)
        };

        const result = await getDbService(req).getAuditLogs(filters);
        res.json({ success: true, data: result });
    } catch (error) {
        const err = error as Error;
        logger.error('Error getting audit logs', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const getAuditStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ success: false, message: '需要管理员权限' });
            return;
        }

        const stats = await getDbService(req).getAuditStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        const err = error as Error;
        logger.error('Error getting audit stats', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

export {
    getAuditLogs,
    getAuditStats
};
