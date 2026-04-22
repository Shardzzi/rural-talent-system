import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { getDbService } from '../services/dbServiceFactory';
import { AuthenticatedRequest } from '../types';

const ACTION_MAP: Record<string, string> = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete'
};

const extractResourceInfo = (originalUrl: string): { resourceType: string; resourceId: number | null } => {
    const pathParts = originalUrl.replace(/^\/api\//, '').split('/').filter(Boolean);

    const resourceType = pathParts[0] || 'unknown';
    const secondPart = pathParts[1];
    let resourceId: number | null = null;

    if (secondPart) {
        const parsed = parseInt(secondPart, 10);
        if (!isNaN(parsed)) {
            resourceId = parsed;
        }
    }

    return { resourceType, resourceId };
};

const auditMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const method = req.method.toUpperCase();

    if (!ACTION_MAP[method]) {
        next();
        return;
    }

    const originalEnd = res.end.bind(res);

    const finishResponse = (chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void): Response => {
        const userId = req.user?.userId ?? null;
        const username = req.user?.username ?? null;
        const action = ACTION_MAP[method];
        const { resourceType, resourceId } = extractResourceInfo(req.originalUrl);
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : req.ip) || null;
        const userAgent = req.headers['user-agent'] || null;

        let details = '';
        if (method === 'DELETE') {
            details = `删除 ${resourceType}${resourceId ? ` ID:${resourceId}` : ''}`;
        } else if (req.body && typeof req.body === 'object') {
            const safeBody = { ...req.body };
            if (safeBody.password) safeBody.password = '[REDACTED]';
            details = JSON.stringify(safeBody);
        }

        const dbService = req.app.get('dbService');
        if (dbService) {
            dbService.logAudit(
                userId, username, action, resourceType, resourceId, details, ip, userAgent
            ).catch((err: Error) => {
                logger.error('Async audit log failed', { error: err.message });
            });
        }

        if (typeof encoding === 'function') {
            return originalEnd(chunk, encoding) as Response;
        }
        return originalEnd(chunk, encoding, cb) as Response;
    };

    res.end = finishResponse as typeof res.end;

    next();
};

export { auditMiddleware };
