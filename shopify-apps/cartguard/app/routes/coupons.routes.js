import { Router } from 'express';
import { 
  createCoupon, getCoupon, getCoupons, getCouponByCode,
  updateCoupon, incrementCouponUsage, deleteCoupon 
} from '../models/coupon.js';

const router = Router();

// Get all coupons for a store
router.get('/', (req, res) => {
  const { store_id, active } = req.query;
  
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    const coupons = getCoupons(store_id, active !== 'false');
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get coupon by code
router.get('/code/:code', (req, res) => {
  const { store_id } = req.query;
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    const coupon = getCouponByCode(store_id, req.params.code);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single coupon
router.get('/:id', (req, res) => {
  try {
    const coupon = getCoupon(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create coupon
router.post('/', (req, res) => {
  const { store_id, code, type, value, min_cart_value, max_uses, expires_at } = req.body;
  
  if (!store_id || !code) {
    return res.status(400).json({ error: 'Missing store_id or code' });
  }
  
  try {
    const coupon = createCoupon({ store_id, code, type, value, min_cart_value, max_uses, expires_at });
    res.status(201).json({ coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update coupon
router.put('/:id', (req, res) => {
  try {
    const coupon = updateCoupon(req.params.id, req.body);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment coupon usage
router.post('/:id/use', (req, res) => {
  try {
    incrementCouponUsage(req.params.id);
    const coupon = getCoupon(req.params.id);
    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete coupon
router.delete('/:id', (req, res) => {
  try {
    deleteCoupon(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
