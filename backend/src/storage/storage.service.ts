import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'tvk-images-bucket';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn('R2 credentials are not fully set in environment variables');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  /**
   * Uploads a file to Cloudflare R2
   * @param file The file from multer
   * @param folder Optional folder path prefix (e.g. 'cadres/')
   * @returns The public URL of the uploaded file
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = '',
  ): Promise<string | null> {
    try {
      if (!file) return null;

      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      const destination = folder
        ? `${folder}${uniqueFilename}`
        : uniqueFilename;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: destination,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      // Return the CDN public URL
      // Remove trailing slash from publicUrl if it exists to avoid double slashes
      const cleanPublicUrl = this.publicUrl.endsWith('/') 
        ? this.publicUrl.slice(0, -1) 
        : this.publicUrl;
      const finalUrl = `${cleanPublicUrl}/${destination}`;

      return finalUrl;
    } catch (error) {
      this.logger.error('Error uploading file to R2', error);
      throw new InternalServerErrorException(
        'Failed to upload file to Cloud Storage',
      );
    }
  }

  /**
   * Deletes a file from Cloudflare R2
   * @param fileUrl The public URL of the file to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl || !this.publicUrl) return;

      const cleanPublicUrl = this.publicUrl.endsWith('/') 
        ? this.publicUrl.slice(0, -1) 
        : this.publicUrl;

      // Extract destination path from the public URL
      if (!fileUrl.startsWith(cleanPublicUrl)) return;

      const urlPrefix = `${cleanPublicUrl}/`;
      const destination = fileUrl.substring(urlPrefix.length);

      // Check if file exists (optional but safe)
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: destination,
        });
        await this.s3Client.send(headCommand);
      } catch (err) {
        // File doesn't exist
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: destination,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted file: ${destination}`);
      
    } catch (error) {
      this.logger.error('Error deleting file from R2', error);
      // We don't throw an error here because this is usually called in a cleanup flow
    }
  }
}
