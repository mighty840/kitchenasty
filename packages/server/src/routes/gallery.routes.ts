import { Router } from 'express';
import { authenticate, requireStaff, requireRole } from '../middleware/auth.js';
import {
  listPublicGallery,
  listAllGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from '../controllers/gallery.controller.js';

const router = Router();

// Public: list active gallery images (optionally filtered by category)
router.get('/', listPublicGallery);

// Staff: full list + CRUD
router.get('/admin', authenticate, requireStaff, listAllGallery);
router.post('/', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), createGalleryImage);
router.patch('/:id', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), updateGalleryImage);
router.delete('/:id', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), deleteGalleryImage);

export default router;
