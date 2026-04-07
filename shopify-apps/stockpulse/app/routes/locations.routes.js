import express from 'express';
import { LocationModel } from '../models/location.js';

const router = express.Router();

// Get all locations
router.get('/', (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) return res.status(400).json({ error: 'Store ID required' });
  
  const locations = LocationModel.findAll(storeId);
  res.json({ locations });
});

// Get single location
router.get('/:id', (req, res) => {
  const location = LocationModel.findById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });
  res.json({ location });
});

// Create location
router.post('/', (req, res) => {
  const storeId = req.headers['x-store-id'];
  const { name, address } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const result = LocationModel.create({ storeId, name, address });
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update location
router.put('/:id', (req, res) => {
  const { name, address } = req.body;
  LocationModel.update(req.params.id, { name, address });
  res.json({ success: true });
});

// Delete location
router.delete('/:id', (req, res) => {
  LocationModel.delete(req.params.id);
  res.json({ success: true });
});

export default router;