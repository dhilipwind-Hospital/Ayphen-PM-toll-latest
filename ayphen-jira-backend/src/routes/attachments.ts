import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|tar|gz)$/i;
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/x-tar', 'application/gzip'
    ];
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// In-memory attachments storage
let attachments: any[] = [];

// Get all attachments for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const issueAttachments = attachments.filter(a => a.issueId === issueId);
    res.json(issueAttachments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file attachment
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { projectId, userId } = req.body;
      
      const attachment = {
        id: `attachment-${Date.now()}`,
        projectId,
        userId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        url: `http://localhost:8500/uploads/${req.file.filename}`,
        uploadedAt: new Date().toISOString(),
      };

      attachments.push(attachment);
      res.status(201).json(attachment);
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Create an attachment (mock - in real app would handle file upload)
router.post('/', async (req, res) => {
  try {
    const { issueId, fileName, fileSize, fileType, url } = req.body;
    
    const attachment = {
      id: `attachment-${Date.now()}`,
      issueId,
      fileName,
      fileSize,
      fileType,
      url: url || `http://localhost:8500/uploads/${fileName}`,
      uploadedAt: new Date().toISOString(),
    };

    attachments.push(attachment);
    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an attachment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attachmentIndex = attachments.findIndex(a => a.id === id);
    
    if (attachmentIndex === -1) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    attachments.splice(attachmentIndex, 1);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get uploaded file
router.get('/file/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to list attachments
router.get('/debug', (req, res) => {
  res.json({ attachments, count: attachments.length });
});

export default router;
