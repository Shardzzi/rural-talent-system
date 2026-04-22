import express, { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
    upload,
    batchDelete,
    batchUpdate,
    importUpload,
    importPreview,
    importConfirm,
    downloadTemplate
} from '../controllers/batchController';

const router: Router = express.Router();

router.post('/batch/delete', authenticateToken, requireAdmin, batchDelete);
router.put('/batch/update', authenticateToken, requireAdmin, batchUpdate);
router.post('/import/upload', authenticateToken, requireAdmin, upload.single('file'), importUpload);
router.post('/import/preview', authenticateToken, requireAdmin, importPreview);
router.post('/import/confirm', authenticateToken, requireAdmin, importConfirm);
router.get('/import/template', authenticateToken, requireAdmin, downloadTemplate);

export default router;
