import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3StorageService } from './s3.service';

export interface StorageService {
  uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folderPrefix?: string
  ): Promise<{ url: string; key: string }>;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
  getDownloadUrl?(key: string, expiresInSeconds?: number): Promise<string>;
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

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folderPrefix?: string
  ): Promise<{ url: string; key: string }> {
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
      console.error(`Failed to delete local file ${key}:`, error);
    }
  }

  async fileExists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, key);
    return fs.existsSync(filePath);
  }

  async getDownloadUrl(key: string): Promise<string> {
    return `${this.backendUrl}/uploads/${key}`;
  }
}

// Choose storage provider based on environment
const isProduction = process.env.NODE_ENV === 'production';
const useS3 = isProduction || process.env.STORAGE_PROVIDER === 's3';

export const storageService: StorageService = useS3
  ? new S3StorageService()
  : new LocalStorageService();
