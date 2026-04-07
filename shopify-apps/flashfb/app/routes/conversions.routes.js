import express from 'express';
import { createConversion, getConversionsByStore, getConversionById, updateConversion, deleteConversion } from '../conversion.js';

const router = express.Router();

router.get('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const conversions = getConversionsByStore(storeId);
  res.json({ conversions });
});

router.get('/:storeId/:id', (req, res) => {
  const { id } = req.params;
  const conversion = getConversionById(id);
  if (!conversion) {
    return res.status(404).json({ error: 'Conversion not found' });
  }
  res.json({ conversion });
});

router.post('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const { name, event_names, rules } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Conversion name is required' });
  }

  const id = createConversion({ store_id: storeId, name, event_names, rules });
  res.json({ success: true, id });
});

router.put('/:storeId/:id', (req, res) => {
  const { id } = req.params;
  const { name, event_names, rules } = req.body;
  
  const updated = updateConversion(id, { name, event_names, rules });
  res.json({ success: true, conversion: updated });
});

router.delete('/:storeId/:id', (req, res) => {
  const { id } = req.params;
  deleteConversion(id);
  res.json({ success: true });
});

export default router;
