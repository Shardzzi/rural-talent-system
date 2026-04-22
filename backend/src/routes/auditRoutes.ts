import express, { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
    getAuditLogs,
    getAuditStats
} from '../controllers/auditController';

const router: Router = express.Router();

router.get('/audit-logs', authenticateToken, requireAdmin, getAuditLogs);
router.get('/audit-logs/stats', authenticateToken, requireAdmin, getAuditStats);

export default router;
