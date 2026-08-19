import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageService {
  uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<{ url: string; key: string }>;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
}

export class LocalStorageService implements StorageService {
  private uploadDir: string;
  private backendUrl: string;

  constructor() {
    this.uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
    this.backendUrl = `http://localhost:${process.env.PORT || 5000}`;
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomUUID();
    const safeFileName = `${uniqueId}${ext}`;
    const filePath = path.join(this.uploadDir, safeFileName);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      url: `${this.backendUrl}/uploads/${safeFileName}`,
      key: safeFileName,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error);
    }
  }

  async fileExists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, key);
    return fs.existsSync(filePath);
  }
}

// Export a single instance
export const storageService: StorageService = new LocalStorageService();
