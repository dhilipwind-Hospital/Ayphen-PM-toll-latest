"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const Attachment_1 = require("../entities/Attachment");
const storage_service_1 = require("../services/storage.service");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storage_service_1.storageService.getUploadDir());
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
    },
    fileFilter: (req, file, cb) => {
        if (storage_service_1.storageService.validateFileType(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
});
// Get all attachments for an issue
router.get('/issue/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const attachmentRepo = database_1.AppDataSource.getRepository(Attachment_1.Attachment);
        const attachments = await attachmentRepo.find({
            where: { issueId },
            order: { uploadedAt: 'DESC' },
        });
        res.json(attachments);
    }
    catch (error) {
        console.error('Error fetching attachments:', error);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
});
// Upload single file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { issueId, uploaderId, description } = req.body;
        const attachmentRepo = database_1.AppDataSource.getRepository(Attachment_1.Attachment);
        const filePath = req.file.path;
        const isImage = storage_service_1.storageService.isImage(req.file.mimetype);
        const isDocument = storage_service_1.storageService.isDocument(req.file.mimetype);
        // Generate thumbnail for images
        let thumbnailPath = null;
        let dimensions = null;
        if (isImage) {
            const thumbnailFileName = await storage_service_1.storageService.generateThumbnail(filePath, req.file.filename);
            if (thumbnailFileName) {
                thumbnailPath = thumbnailFileName;
            }
            // Compress large images
            await storage_service_1.storageService.compressImage(filePath);
            // Get dimensions
            dimensions = await storage_service_1.storageService.getImageDimensions(filePath);
        }
        const attachment = attachmentRepo.create({
            issueId,
            uploaderId,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            filePath: req.file.filename,
            thumbnailPath,
            description,
            isImage,
            isDocument,
            width: dimensions?.width,
            height: dimensions?.height,
        });
        const saved = await attachmentRepo.save(attachment);
        res.status(201).json(saved);
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const { issueId, uploaderId } = req.body;
        const attachmentRepo = database_1.AppDataSource.getRepository(Attachment_1.Attachment);
        const attachments = [];
        for (const file of req.files) {
            const filePath = file.path;
            const isImage = storage_service_1.storageService.isImage(file.mimetype);
            const isDocument = storage_service_1.storageService.isDocument(file.mimetype);
            let thumbnailPath = null;
            let dimensions = null;
            if (isImage) {
                const thumbnailFileName = await storage_service_1.storageService.generateThumbnail(filePath, file.filename);
                if (thumbnailFileName) {
                    thumbnailPath = thumbnailFileName;
                }
                await storage_service_1.storageService.compressImage(filePath);
                dimensions = await storage_service_1.storageService.getImageDimensions(filePath);
            }
            const attachment = attachmentRepo.create({
                issueId,
                uploaderId,
                fileName: file.filename,
                originalName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                filePath: file.filename,
                thumbnailPath,
                isImage,
                isDocument,
                width: dimensions?.width,
                height: dimensions?.height,
            });
            const saved = await attachmentRepo.save(attachment);
            attachments.push(saved);
        }
        res.status(201).json(attachments);
    }
    catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});
// Download file
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const attachmentRepo = database_1.AppDataSource.getRepository(Attachment_1.Attachment);
        const attachment = await attachmentRepo.findOne({ where: { id } });
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }
        const filePath = path_1.default.join(storage_service_1.storageService.getUploadDir(), attachment.fileName);
        res.download(filePath, attachment.originalName);
    }
    catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});
// Get file (for preview)
router.get('/file/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(storage_service_1.storageService.getUploadDir(), filename);
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Error getting file:', error);
        res.status(500).json({ error: 'Failed to get file' });
    }
});
// Get thumbnail
router.get('/thumbnail/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(storage_service_1.storageService.getThumbnailDir(), filename);
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Error getting thumbnail:', error);
        res.status(500).json({ error: 'Failed to get thumbnail' });
    }
});
// Update attachment (rename, add description)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { originalName, description } = req.body;
        const attachmentRepo = database_1.AppDataSource.getRepository(Attachment_1.Attachment);
        const attachment = await attachmentRepo.findOne({ where: { id } });
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }
        if (originalName)
            attachment.originalName = originalName;
        if (description !== undefined)
            attachment.description = description;
        const updated = await attachmentRepo.save(attachment);
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating attachment:', error);
        res.status(500).json({ error: 'Failed to update attachment' });
    }
});
// Delete attachment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const attachmentRepo = database_1.AppDataSource.getRepository(Attachment_1.Attachment);
        const attachment = await attachmentRepo.findOne({ where: { id } });
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }
        // Delete files from disk
        const filePath = path_1.default.join(storage_service_1.storageService.getUploadDir(), attachment.fileName);
        storage_service_1.storageService.deleteFile(filePath);
        if (attachment.thumbnailPath) {
            const thumbnailPath = path_1.default.join(storage_service_1.storageService.getThumbnailDir(), attachment.thumbnailPath);
            storage_service_1.storageService.deleteFile(thumbnailPath);
        }
        await attachmentRepo.delete(id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});
// Download all attachments as ZIP
router.get('/download-all/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const attachmentRepo = database_1.AppDataSource.getRepository(Attachment_1.Attachment);
        const attachments = await attachmentRepo.find({ where: { issueId } });
        if (attachments.length === 0) {
            return res.status(404).json({ error: 'No attachments found' });
        }
        // For now, return list of download URLs
        // In production, would create a ZIP file
        const downloadUrls = attachments.map(a => ({
            id: a.id,
            name: a.originalName,
            url: `/api/attachments-v2/download/${a.id}`,
        }));
        res.json(downloadUrls);
    }
    catch (error) {
        console.error('Error downloading all attachments:', error);
        res.status(500).json({ error: 'Failed to download attachments' });
    }
});
exports.default = router;
