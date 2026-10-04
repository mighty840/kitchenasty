import { Router } from 'express';
import { authenticate, requireStaff, requireRole } from '../middleware/auth.js';
import {
  createCoupon,
  listCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/coupon.controller.js';

const router = Router();

// Public: validate coupon
router.post('/validate', validateCoupon);

// Staff: manage coupons
router.get('/', authenticate, requireStaff, listCoupons);
router.get('/:id', authenticate, requireStaff, getCoupon);
router.post('/', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), createCoupon);
router.patch('/:id', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), updateCoupon);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), deleteCoupon);

export default router;
