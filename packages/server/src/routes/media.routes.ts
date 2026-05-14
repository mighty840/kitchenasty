import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadMedia, listMedia, deleteMedia } from '../controllers/media.controller.js';

const router = Router();

router.get('/', authenticate, requireStaff, listMedia);
router.post('/upload', authenticate, requireStaff, upload.single('file'), uploadMedia);
router.delete('/:id', authenticate, requireStaff, deleteMedia);

export default router;
