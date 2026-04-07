import express from 'express';
import { SupplierModel } from '../models/supplier.js';

const router = express.Router();

// Get all suppliers
router.get('/', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  const suppliers = SupplierModel.findAll(storeId);
  res.json({ suppliers });
});

// Get single supplier
router.get('/:id', (req, res) => {
  const supplier = SupplierModel.findById(req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  res.json({ supplier });
});

// Create supplier
router.post('/', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const { name, email, phone, leadTimeDays, minimumOrder } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const result = SupplierModel.create({
    storeId, name, email, phone, leadTimeDays, minimumOrder
  });
  
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update supplier
router.put('/:id', (req, res) => {
  const { name, email, phone, leadTimeDays, minimumOrder } = req.body;
  SupplierModel.update(req.params.id, { name, email, phone, leadTimeDays, minimumOrder });
  res.json({ success: true });
});

// Delete supplier
router.delete('/:id', (req, res) => {
  SupplierModel.delete(req.params.id);
  res.json({ success: true });
});

export default router;