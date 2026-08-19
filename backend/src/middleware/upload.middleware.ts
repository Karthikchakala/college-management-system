import multer from 'multer';
import path from 'path';
import { AppError } from './error.middleware';

// Store in memory buffer so we can pass it to the StorageService abstraction
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new AppError('Only PDF, Word documents, and images (.png, .jpg, .jpeg) are allowed', 400, 'INVALID_FILE_TYPE'));
  }
  
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});
export default upload;
