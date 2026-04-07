import express from 'express';
import * as segmentationService from '../services/segmentation.service.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const segments = segmentationService.getAllSegments(req.db, req.store.id);
    res.json({ segments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const segment = segmentationService.getSegment(req.db, req.store.id, req.params.id);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json(segment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/customers', (req, res) => {
  try {
    const { sort, limit, offset } = req.query;
    const customers = segmentationService.getSegmentCustomers(req.db, req.store.id, req.params.id, {
      sort: sort || 'total_spent DESC',
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, rules } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    
    const id = segmentationService.createSegment(req.db, req.store.id, name, description || '', rules || []);
    res.json({ id, message: 'Segment created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/preview', (req, res) => {
  try {
    const { rules } = req.body;
    const result = segmentationService.previewSegment(req.db, req.store.id, rules || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, description, rules } = req.body;
    segmentationService.updateSegment(req.db, req.store.id, req.params.id, name, description || '', rules || []);
    res.json({ message: 'Segment updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    segmentationService.deleteSegment(req.db, req.store.id, req.params.id);
    res.json({ message: 'Segment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
