import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export class StorageService {
  private uploadDir: string;
  private thumbnailDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
    }
  }

  public getUploadDir(): string {
    return this.uploadDir;
  }

  public getThumbnailDir(): string {
    return this.thumbnailDir;
  }

  public async generateThumbnail(filePath: string, fileName: string): Promise<string | null> {
    try {
      const ext = path.extname(fileName).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      
      if (!imageExtensions.includes(ext)) {
        return null;
      }

      const thumbnailFileName = `thumb_${fileName}`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFileName);

      await sharp(filePath)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(thumbnailPath);

      return thumbnailFileName;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  public async compressImage(filePath: string): Promise<void> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png'];
      
      if (!imageExtensions.includes(ext)) {
        return;
      }

      const metadata = await sharp(filePath).metadata();
      
      // Compress if file is large
      if (metadata.size && metadata.size > 1024 * 1024) { // > 1MB
        await sharp(filePath)
          .jpeg({ quality: 80 })
          .toFile(filePath + '.tmp');
        
        fs.renameSync(filePath + '.tmp', filePath);
      }
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  }

  public async getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
    try {
      const metadata = await sharp(filePath).metadata();
      if (metadata.width && metadata.height) {
        return { width: metadata.width, height: metadata.height };
      }
      return null;
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }

  public deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  public isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  public isDocument(mimeType: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    return documentTypes.includes(mimeType);
  }

  public validateFileType(mimeType: string): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain',
      'text/csv',
      // Code
      'text/javascript',
      'text/typescript',
      'text/python',
      'text/java',
      // Archives
      'application/zip',
      'application/x-tar',
      'application/gzip',
    ];
    return allowedTypes.includes(mimeType);
  }

  public validateFileSize(size: number): boolean {
    const maxSize = 25 * 1024 * 1024; // 25MB
    return size <= maxSize;
  }
}

export const storageService = new StorageService();
