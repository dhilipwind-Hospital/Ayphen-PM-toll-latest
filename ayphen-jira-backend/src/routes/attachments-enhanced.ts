import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { AppDataSource } from '../config/database';
import { Attachment } from '../entities/Attachment';
import { storageService } from '../services/storage.service';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageService.getUploadDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (req, file, cb) => {
    if (storageService.validateFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Get all attachments for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const attachmentRepo = AppDataSource.getRepository(Attachment);
    
    const attachments = await attachmentRepo.find({
      where: { issueId },
      order: { uploadedAt: 'DESC' },
    });
    
    res.json(attachments);
  } catch (error) {
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
    const attachmentRepo = AppDataSource.getRepository(Attachment);

    const filePath = req.file.path;
    const isImage = storageService.isImage(req.file.mimetype);
    const isDocument = storageService.isDocument(req.file.mimetype);

    // Generate thumbnail for images
    let thumbnailPath = null;
    let dimensions = null;
    
    if (isImage) {
      const thumbnailFileName = await storageService.generateThumbnail(filePath, req.file.filename);
      if (thumbnailFileName) {
        thumbnailPath = thumbnailFileName;
      }
      
      // Compress large images
      await storageService.compressImage(filePath);
      
      // Get dimensions
      dimensions = await storageService.getImageDimensions(filePath);
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
  } catch (error) {
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
    const attachmentRepo = AppDataSource.getRepository(Attachment);
    const attachments = [];

    for (const file of req.files) {
      const filePath = file.path;
      const isImage = storageService.isImage(file.mimetype);
      const isDocument = storageService.isDocument(file.mimetype);

      let thumbnailPath = null;
      let dimensions = null;
      
      if (isImage) {
        const thumbnailFileName = await storageService.generateThumbnail(filePath, file.filename);
        if (thumbnailFileName) {
          thumbnailPath = thumbnailFileName;
        }
        await storageService.compressImage(filePath);
        dimensions = await storageService.getImageDimensions(filePath);
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
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Download file
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attachmentRepo = AppDataSource.getRepository(Attachment);
    
    const attachment = await attachmentRepo.findOne({ where: { id } });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.join(storageService.getUploadDir(), attachment.fileName);
    res.download(filePath, attachment.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get file (for preview)
router.get('/file/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(storageService.getUploadDir(), filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Get thumbnail
router.get('/thumbnail/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(storageService.getThumbnailDir(), filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    res.status(500).json({ error: 'Failed to get thumbnail' });
  }
});

// Update attachment (rename, add description)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { originalName, description } = req.body;
    const attachmentRepo = AppDataSource.getRepository(Attachment);
    
    const attachment = await attachmentRepo.findOne({ where: { id } });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (originalName) attachment.originalName = originalName;
    if (description !== undefined) attachment.description = description;

    const updated = await attachmentRepo.save(attachment);
    res.json(updated);
  } catch (error) {
    console.error('Error updating attachment:', error);
    res.status(500).json({ error: 'Failed to update attachment' });
  }
});

// Delete attachment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attachmentRepo = AppDataSource.getRepository(Attachment);
    
    const attachment = await attachmentRepo.findOne({ where: { id } });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete files from disk
    const filePath = path.join(storageService.getUploadDir(), attachment.fileName);
    storageService.deleteFile(filePath);
    
    if (attachment.thumbnailPath) {
      const thumbnailPath = path.join(storageService.getThumbnailDir(), attachment.thumbnailPath);
      storageService.deleteFile(thumbnailPath);
    }

    await attachmentRepo.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Download all attachments as ZIP
router.get('/download-all/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const attachmentRepo = AppDataSource.getRepository(Attachment);
    
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
  } catch (error) {
    console.error('Error downloading all attachments:', error);
    res.status(500).json({ error: 'Failed to download attachments' });
  }
});

export default router;
