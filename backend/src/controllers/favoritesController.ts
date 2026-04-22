import { Response } from 'express';
import logger from '../config/logger';
import { getDbService } from '../services/dbServiceFactory';
import { AuthenticatedRequest } from '../types';

const getUserFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const favorites = await getDbService(req).getUserFavorites(userId);
        res.json({ success: true, data: favorites });
    } catch (error) {
        const err = error as Error;
        logger.error('Error getting user favorites', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const addFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const personId = parseInt(req.params.personId as string, 10);
        if (isNaN(personId) || personId < 1) {
            res.status(400).json({ success: false, message: '无效的人员ID' });
            return;
        }

        const notes = req.body?.notes || '';
        const result = await getDbService(req).addFavorite(userId, personId, notes);
        logger.info('Favorite added', { userId, personId });
        res.status(201).json({ success: true, data: result, message: '收藏成功' });
    } catch (error) {
        const err = error as Error;
        if (err.message?.includes('UNIQUE') || err.message?.includes('已收藏') || err.message?.includes('Duplicate')) {
            res.status(409).json({ success: false, message: '已经收藏过该人才' });
            return;
        }
        logger.error('Error adding favorite', { error: err.message, userId: req.user?.userId, personId: req.params.personId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const removeFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const personId = parseInt(req.params.personId as string, 10);
        if (isNaN(personId) || personId < 1) {
            res.status(400).json({ success: false, message: '无效的人员ID' });
            return;
        }

        const removed = await getDbService(req).removeFavorite(userId, personId);
        if (!removed) {
            res.status(404).json({ success: false, message: '未找到收藏记录' });
            return;
        }
        logger.info('Favorite removed', { userId, personId });
        res.json({ success: true, message: '取消收藏成功' });
    } catch (error) {
        const err = error as Error;
        logger.error('Error removing favorite', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateFavoriteNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' });
            return;
        }

        const personId = parseInt(req.params.personId as string, 10);
        if (isNaN(personId) || personId < 1) {
            res.status(400).json({ success: false, message: '无效的人员ID' });
            return;
        }

        const notes = req.body?.notes;
        if (typeof notes !== 'string') {
            res.status(400).json({ success: false, message: 'notes必须为字符串' });
            return;
        }

        const updated = await getDbService(req).updateFavoriteNotes(userId, personId, notes);
        if (!updated) {
            res.status(404).json({ success: false, message: '未找到收藏记录' });
            return;
        }
        logger.info('Favorite notes updated', { userId, personId });
        res.json({ success: true, message: '更新备注成功' });
    } catch (error) {
        const err = error as Error;
        logger.error('Error updating favorite notes', { error: err.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: err.message });
    }
};

export {
    getUserFavorites,
    addFavorite,
    removeFavorite,
    updateFavoriteNotes
};
