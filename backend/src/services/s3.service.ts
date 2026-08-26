import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import { StorageService } from './storage.service';

export class S3StorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET || 'cloudcampus-511225358997';
    // S3Client automatically resolves credentials from EC2 IAM Role default credential provider chain
    this.s3Client = new S3Client({
      region: this.region,
    });
  }

  /**
   * Uploads a file buffer to private S3 bucket with organized prefixes.
   */
  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folderPrefix: string = 'documents'
  ): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomUUID();
    const sanitizedName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `${folderPrefix}/${uniqueId}-${sanitizedName}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Bucket remains strictly private; no public ACLs are set
    });

    await this.s3Client.send(command);

    // Generate a short-lived presigned URL for immediate usage
    const presignedUrl = await this.getDownloadUrl(key);

    return {
      url: presignedUrl,
      key,
    };
  }

  /**
   * Generates a secure, temporary presigned GET URL for a private S3 object.
   * Expires by default in 900 seconds (15 minutes).
   */
  async getDownloadUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Deletes an object from S3.
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error: any) {
      console.error(`[S3StorageService] Failed to delete S3 key ${key}:`, error.message);
    }
  }

  /**
   * Checks if an object exists in S3.
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      console.error(`[S3StorageService] HeadObject error for ${key}:`, error.message);
      return false;
    }
  }
}
