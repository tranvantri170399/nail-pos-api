import { Injectable, Logger } from '@nestjs/common';
import { imageProcessor } from '../common/config/multer.config';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  async processImageUpload(file: Express.Multer.File, type: string) {
    try {
      // Process image with Sharp (resize and optimize)
      await imageProcessor(file.path, 800, 800);

      return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${type}/${file.filename}`,
      };
    } catch (error) {
      this.logger.error('Error processing image upload:', error);
      throw error;
    }
  }
}
