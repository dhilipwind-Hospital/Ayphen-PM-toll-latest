"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
class StorageService {
    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads');
        this.thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
        this.ensureDirectories();
    }
    ensureDirectories() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
        if (!fs.existsSync(this.thumbnailDir)) {
            fs.mkdirSync(this.thumbnailDir, { recursive: true });
        }
    }
    getUploadDir() {
        return this.uploadDir;
    }
    getThumbnailDir() {
        return this.thumbnailDir;
    }
    async generateThumbnail(filePath, fileName) {
        try {
            const ext = path.extname(fileName).toLowerCase();
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            if (!imageExtensions.includes(ext)) {
                return null;
            }
            const thumbnailFileName = `thumb_${fileName}`;
            const thumbnailPath = path.join(this.thumbnailDir, thumbnailFileName);
            await (0, sharp_1.default)(filePath)
                .resize(200, 200, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .toFile(thumbnailPath);
            return thumbnailFileName;
        }
        catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    }
    async compressImage(filePath) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            const imageExtensions = ['.jpg', '.jpeg', '.png'];
            if (!imageExtensions.includes(ext)) {
                return;
            }
            const metadata = await (0, sharp_1.default)(filePath).metadata();
            // Compress if file is large
            if (metadata.size && metadata.size > 1024 * 1024) { // > 1MB
                await (0, sharp_1.default)(filePath)
                    .jpeg({ quality: 80 })
                    .toFile(filePath + '.tmp');
                fs.renameSync(filePath + '.tmp', filePath);
            }
        }
        catch (error) {
            console.error('Error compressing image:', error);
        }
    }
    async getImageDimensions(filePath) {
        try {
            const metadata = await (0, sharp_1.default)(filePath).metadata();
            if (metadata.width && metadata.height) {
                return { width: metadata.width, height: metadata.height };
            }
            return null;
        }
        catch (error) {
            console.error('Error getting image dimensions:', error);
            return null;
        }
    }
    deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            console.error('Error deleting file:', error);
        }
    }
    isImage(mimeType) {
        return mimeType.startsWith('image/');
    }
    isDocument(mimeType) {
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
    validateFileType(mimeType) {
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
    validateFileSize(size) {
        const maxSize = 25 * 1024 * 1024; // 25MB
        return size <= maxSize;
    }
}
exports.StorageService = StorageService;
exports.storageService = new StorageService();
