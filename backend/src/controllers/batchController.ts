import { Response } from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import logger from '../config/logger';
import { getDbService } from '../services/dbServiceFactory';
import { AuthenticatedRequest, ImportPreviewRow, ImportError } from '../types/index';

const CSV_TEMPLATE_HEADERS = [
    '姓名', '年龄', '性别', '电话', '邮箱', '地址', '学历', '政治面貌'
];

const HEADER_TO_FIELD: Record<string, string> = {
    '姓名': 'name',
    '年龄': 'age',
    '性别': 'gender',
    '电话': 'phone',
    '邮箱': 'email',
    '地址': 'address',
    '学历': 'education_level',
    '政治面貌': 'political_status'
};

const FIELD_TO_HEADER: Record<string, string> = {};
for (const [header, field] of Object.entries(HEADER_TO_FIELD)) {
    FIELD_TO_HEADER[field] = header;
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        const allowedExts = ['.csv', '.xlsx', '.xls'];
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件格式，请上传 CSV 或 XLSX 文件'));
        }
    }
});

const parseFileToRows = (buffer: Buffer, mimetype: string, originalname: string): Record<string, unknown>[] => {
    const ext = originalname.toLowerCase().slice(originalname.lastIndexOf('.'));

    if (ext === '.csv' || mimetype === 'text/csv') {
        const csvContent = buffer.toString('utf-8');
        const rows = csvParse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        });
        return rows as Record<string, unknown>[];
    }

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);
};

const mapRowFields = (rawRow: Record<string, unknown>): Record<string, unknown> => {
    const mapped: Record<string, unknown> = {};
    for (const [header, field] of Object.entries(HEADER_TO_FIELD)) {
        if (rawRow[header] !== undefined) {
            mapped[field] = rawRow[header];
        }
        if (rawRow[field] !== undefined) {
            mapped[field] = rawRow[field];
        }
    }
    return mapped;
};

const importSessions = new Map<string, { rows: Record<string, unknown>[]; previews: ImportPreviewRow[] }>();

const batchDelete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ success: false, message: '请提供要删除的人员ID列表' });
            return;
        }

        for (const id of ids) {
            if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) {
                res.status(400).json({ success: false, message: 'ID列表包含无效值' });
                return;
            }
        }

        if (ids.length > 500) {
            res.status(400).json({ success: false, message: '单次批量删除不能超过500条' });
            return;
        }

        logger.info('Batch delete request', { ids, userId: req.user?.userId });

        const deletedCount = await getDbService(req).batchDeletePersons(ids);

        res.json({
            success: true,
            message: `成功删除 ${deletedCount} 条记录`,
            data: { deletedCount }
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error in batch delete', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: error.message });
    }
};

const batchUpdate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { ids, updates } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ success: false, message: '请提供要更新的人员ID列表' });
            return;
        }

        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
            res.status(400).json({ success: false, message: '请提供更新数据' });
            return;
        }

        for (const id of ids) {
            if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) {
                res.status(400).json({ success: false, message: 'ID列表包含无效值' });
                return;
            }
        }

        if (ids.length > 500) {
            res.status(400).json({ success: false, message: '单次批量更新不能超过500条' });
            return;
        }

        const ALLOWED_FIELDS = ['education_level', 'employment_status', 'political_status', 'address', 'phone'];
        const disallowedFields = Object.keys(updates).filter(k => !ALLOWED_FIELDS.includes(k));
        if (disallowedFields.length > 0) {
            res.status(400).json({
                success: false,
                message: `不允许批量更新以下字段: ${disallowedFields.join(', ')}。允许的字段: ${ALLOWED_FIELDS.join(', ')}`
            });
            return;
        }

        logger.info('Batch update request', { ids, updates, userId: req.user?.userId });

        const updatedCount = await getDbService(req).batchUpdatePersons(ids, updates);

        res.json({
            success: true,
            message: `成功更新 ${updatedCount} 条记录`,
            data: { updatedCount }
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error in batch update', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: error.message });
    }
};

const importUpload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: '请上传文件' });
            return;
        }

        const rawRows = parseFileToRows(req.file.buffer, req.file.mimetype, req.file.originalname);

        if (rawRows.length === 0) {
            res.status(400).json({ success: false, message: '文件中没有数据' });
            return;
        }

        const mappedRows = rawRows.map(row => mapRowFields(row));

        const previews: ImportPreviewRow[] = mappedRows.map((data, index) => {
            const errors = (getDbService(req).validatePersonData(data, index + 1) as unknown as ImportError[]).map(e => e.message);
            return {
                rowIndex: index + 1,
                data,
                errors,
                valid: errors.length === 0
            };
        });

        const sessionId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        importSessions.set(sessionId, { rows: mappedRows, previews });

        setTimeout(() => {
            importSessions.delete(sessionId);
        }, 30 * 60 * 1000);

        logger.info('Import file uploaded', {
            sessionId,
            filename: req.file?.originalname,
            rowCount: rawRows.length,
            validCount: previews.filter(p => p.valid).length
        });

        res.json({
            success: true,
            data: {
                sessionId,
                totalRows: rawRows.length,
                validRows: previews.filter(p => p.valid).length,
                invalidRows: previews.filter(p => !p.valid).length
            }
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error uploading import file', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: error.message });
    }
};

const importPreview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.body;

        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({ success: false, message: '请提供导入会话ID' });
            return;
        }

        const session = importSessions.get(sessionId);
        if (!session) {
            res.status(404).json({ success: false, message: '导入会话已过期，请重新上传文件' });
            return;
        }

        res.json({
            success: true,
            data: {
                totalRows: session.previews.length,
                validRows: session.previews.filter(p => p.valid).length,
                invalidRows: session.previews.filter(p => !p.valid).length,
                previews: session.previews
            }
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error getting import preview', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: error.message });
    }
};

const importConfirm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.body;

        if (!sessionId || typeof sessionId !== 'string') {
            res.status(400).json({ success: false, message: '请提供导入会话ID' });
            return;
        }

        const session = importSessions.get(sessionId);
        if (!session) {
            res.status(404).json({ success: false, message: '导入会话已过期，请重新上传文件' });
            return;
        }

        const validRows = session.previews
            .filter(p => p.valid)
            .map(p => p.data);

        if (validRows.length === 0) {
            res.status(400).json({
                success: false,
                message: '没有有效的数据可以导入',
                data: { total: session.previews.length, success: 0, failed: session.previews.length, errors: session.previews.filter(p => !p.valid).flatMap(p => p.errors.map((msg, idx) => ({ row: p.rowIndex, field: `error_${idx}`, message: msg }))) }
            });
            return;
        }

        logger.info('Confirming import', { sessionId, validCount: validRows.length, userId: req.user?.userId });

        const result = await getDbService(req).importPersons(validRows);

        importSessions.delete(sessionId);

        res.json({
            success: true,
            message: `导入完成: 成功 ${result.success} 条, 失败 ${result.failed} 条`,
            data: result
        });
    } catch (err) {
        const error = err as Error;
        logger.error('Error confirming import', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: error.message });
    }
};

const downloadTemplate = (_req: AuthenticatedRequest, res: Response): void => {
    try {
        const BOM = '\uFEFF';
        const headerRow = CSV_TEMPLATE_HEADERS.join(',');
        const sampleRow1 = '张三,25,男,13812345678,zhangsan@example.com,山东省烟台市,本科,群众';
        const sampleRow2 = '李四,30,女,13987654321,lisi@example.com,山东省青岛市,大专,党员';

        const csvContent = BOM + headerRow + '\n' + sampleRow1 + '\n' + sampleRow2 + '\n';

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="import_template.csv"');
        res.send(csvContent);
    } catch (err) {
        const error = err as Error;
        logger.error('Error downloading template', { error: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    upload,
    batchDelete,
    batchUpdate,
    importUpload,
    importPreview,
    importConfirm,
    downloadTemplate,
    CSV_TEMPLATE_HEADERS,
    HEADER_TO_FIELD,
    parseFileToRows,
    mapRowFields
};
