import { Router } from 'express';
import { 
  createVisitor, getVisitor, getVisitors, getVisitorCount,
  updateVisitor, getOrCreateVisitor 
} from '../models/visitor.js';

const router = Router();

// Get visitors for a store
router.get('/', (req, res) => {
  const { store_id, status, limit = 50, offset = 0 } = req.query;
  
  if (!store_id) {
    return res.status(400).json({ error: 'Missing store_id' });
  }
  
  try {
    const visitors = getVisitors(store_id, { status, limit: parseInt(limit), offset: parseInt(offset) });
    const total = getVisitorCount(store_id, status);
    
    res.json({ visitors, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single visitor
router.get('/:id', (req, res) => {
  try {
    const visitor = getVisitor(req.params.id);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json({ visitor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or get visitor (for storefront tracking)
router.post('/track', (req, res) => {
  const { store_id, session_id, email, phone, cart_contents, cart_value, status, source, campaign_id } = req.body;
  
  if (!store_id || !session_id) {
    return res.status(400).json({ error: 'Missing store_id or session_id' });
  }
  
  try {
    const visitor = getOrCreateVisitor(store_id, session_id);
    
    // Update if provided
    const updates = {};
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (cart_contents) updates.cart_contents = cart_contents;
    if (cart_value !== undefined) updates.cart_value = cart_value;
    if (status) updates.status = status;
    if (source) updates.source = source;
    if (campaign_id) updates.campaign_id = campaign_id;
    
    if (Object.keys(updates).length > 0) {
      updateVisitor(visitor.id, updates);
    }
    
    const updated = getVisitor(visitor.id);
    res.json({ visitor: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Capture email
router.post('/email', (req, res) => {
  const { visitor_id, email, cart_contents, cart_value } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  
  try {
    const data = { email };
    if (cart_contents) data.cart_contents = cart_contents;
    if (cart_value !== undefined) data.cart_value = cart_value;
    
    if (visitor_id) {
      const visitor = updateVisitor(visitor_id, data);
      res.json({ visitor });
    } else {
      // Create new visitor with email
      const visitor = createVisitor(data);
      res.status(201).json({ visitor });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update visitor
router.put('/:id', (req, res) => {
  try {
    const visitor = updateVisitor(req.params.id, req.body);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json({ visitor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
