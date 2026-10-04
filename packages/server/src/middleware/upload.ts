import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// The stored extension comes from the checked mimetype, never the client's filename, so
// /uploads can only ever serve image types (an .html or .svg name would be stored XSS).
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const ALLOWED_TYPES = Object.keys(EXTENSIONS);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${EXTENSIONS[file.mimetype]}`);
  },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});
