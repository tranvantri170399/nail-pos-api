import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

// Ensure upload directories exist
const uploadDirs = ['./uploads/staff', './uploads/services', './uploads/customers'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadType = req.body.type || 'general';
      let uploadPath = './uploads';
      
      if (uploadType === 'staff') {
        uploadPath = './uploads/staff';
      } else if (uploadType === 'service') {
        uploadPath = './uploads/services';
      } else if (uploadType === 'customer') {
        uploadPath = './uploads/customers';
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};

export const imageProcessor = async (filePath: string, width?: number, height?: number) => {
  try {
    let sharpInstance = sharp(filePath);
    
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'cover',
        position: 'center',
      });
    }
    
    // Optimize image
    sharpInstance = sharpInstance
      .webp({ quality: 80 })
      .jpeg({ quality: 80 })
      .png({ compressionLevel: 9 });
    
    await sharpInstance.toFile(filePath);
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
