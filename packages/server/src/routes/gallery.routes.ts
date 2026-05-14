import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth.js';
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
router.post('/', authenticate, requireStaff, createGalleryImage);
router.patch('/:id', authenticate, requireStaff, updateGalleryImage);
router.delete('/:id', authenticate, requireStaff, deleteGalleryImage);

export default router;
