import { Router, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFile } from './uploadController';
import authenticate from '../middlewares/authenticate';

const router = Router();

const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'audio/mpeg',
  'video/mp4',
  'video/webm'
]);

const allowedExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.mp3',
  '.mp4',
  '.webm',
  '.mpeg'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req: Request, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = allowedMimeTypes.has(file.mimetype);
  const isAllowedExtension = allowedExtensions.has(extension);

  if (isAllowedMime && isAllowedExtension) {
    cb(null, true);
    return;
  }

  cb(new Error('Only image and document files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 10MB
  },
});

router.post('/', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'File upload failed',
      });
    }

    return next();
  });
}, uploadFile);

export default router;
