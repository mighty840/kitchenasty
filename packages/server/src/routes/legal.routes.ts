import { Router } from 'express';
import { authenticate, requireStaff, requireRole } from '../middleware/auth.js';
import {
  listLegalPages,
  getLegalPage,
  upsertLegalPage,
  listCookieCategories,
  createCookieCategory,
  updateCookieCategory,
  deleteCookieCategory,
} from '../controllers/legal.controller.js';

const router = Router();

// Cookie categories must be matched before :slug
router.get('/cookie-categories', listCookieCategories);
router.post('/cookie-categories', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), createCookieCategory);
router.patch('/cookie-categories/:id', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), updateCookieCategory);
router.delete('/cookie-categories/:id', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), deleteCookieCategory);

// Legal pages
router.get('/', listLegalPages);
router.get('/:slug', getLegalPage);
router.put('/:slug', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), upsertLegalPage);

export default router;
