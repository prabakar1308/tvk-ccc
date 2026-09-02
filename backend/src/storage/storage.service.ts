import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'tvk-dev-bucket';
    this.storage = new Storage(); // Auto-loads credentials from GOOGLE_APPLICATION_CREDENTIALS env var
  }

  /**
   * Uploads a file to Google Cloud Storage
   * @param file The file from multer
   * @param folder Optional folder path prefix (e.g. 'cadres/')
   * @returns The public URL of the uploaded file
   */
  async uploadFile(file: Express.Multer.File, folder: string = ''): Promise<string | null> {
    try {
      if (!file) return null;

      const bucket = this.storage.bucket(this.bucketName);
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      const destination = folder ? `${folder}${uniqueFilename}` : uniqueFilename;
      
      const fileRef = bucket.file(destination);

      await fileRef.save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
      });

      // Usually, if the bucket is public, the URL looks like this:
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${destination}`;
      
      return publicUrl;
    } catch (error) {
      this.logger.error('Error uploading file to GCS', error);
      throw new InternalServerErrorException('Failed to upload file to Cloud Storage');
    }
  }

  /**
   * Deletes a file from Google Cloud Storage
   * @param publicUrl The public URL of the file to delete
   */
  async deleteFile(publicUrl: string): Promise<void> {
    try {
      if (!publicUrl || !publicUrl.includes(this.bucketName)) return;

      // Extract destination path from the public URL
      // https://storage.googleapis.com/<bucketName>/<destination>
      const urlPrefix = `https://storage.googleapis.com/${this.bucketName}/`;
      if (!publicUrl.startsWith(urlPrefix)) return;

      const destination = publicUrl.substring(urlPrefix.length);
      const bucket = this.storage.bucket(this.bucketName);
      const fileRef = bucket.file(destination);

      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
        this.logger.log(`Deleted orphaned file: ${destination}`);
      }
    } catch (error) {
      this.logger.error('Error deleting file from GCS', error);
      // We don't throw an error here because this is usually called in a cleanup flow
      // and we don't want to break the main application flow if a cleanup fails.
    }
  }
}
