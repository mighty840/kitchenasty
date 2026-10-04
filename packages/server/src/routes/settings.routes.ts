import { Router } from 'express';
import { authenticate, requireStaff, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadFavicon,
  getGeneralSettings,
  updateGeneralSettings,
  getOrderSettings,
  updateOrderSettings,
  getReservationSettings,
  updateReservationSettings,
  getMailSettings,
  updateMailSettings,
  sendTestEmail,
  getPaymentSettings,
  updatePaymentSettings,
  getReviewSettings,
  updateReviewSettings,
  getAdvancedSettings,
  updateAdvancedSettings,
} from '../controllers/settings.controller.js';

const router = Router();

// Existing branding/design routes
router.get('/', getSettings);
router.put('/', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), updateSettings);
router.post('/logo', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), upload.single('logo'), uploadLogo);
router.post('/favicon', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), upload.single('favicon'), uploadFavicon);

// General — MANAGER+
router.get('/general', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), getGeneralSettings);
router.put('/general', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), updateGeneralSettings);

// Order — MANAGER+
router.get('/order', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), getOrderSettings);
router.put('/order', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), updateOrderSettings);

// Reservation — MANAGER+
router.get('/reservation', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), getReservationSettings);
router.put('/reservation', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), updateReservationSettings);

// Mail — SUPER_ADMIN only
router.get('/mail', authenticate, requireRole('SUPER_ADMIN'), getMailSettings);
router.put('/mail', authenticate, requireRole('SUPER_ADMIN'), updateMailSettings);
router.post('/mail/test', authenticate, requireRole('SUPER_ADMIN'), sendTestEmail);

// Payment — SUPER_ADMIN only
router.get('/payment', authenticate, requireRole('SUPER_ADMIN'), getPaymentSettings);
router.put('/payment', authenticate, requireRole('SUPER_ADMIN'), updatePaymentSettings);

// Review — MANAGER+
router.get('/review', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), getReviewSettings);
router.put('/review', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), updateReviewSettings);

// Advanced — SUPER_ADMIN only
router.get('/advanced', authenticate, requireRole('SUPER_ADMIN'), getAdvancedSettings);
router.put('/advanced', authenticate, requireRole('SUPER_ADMIN'), updateAdvancedSettings);

export default router;
