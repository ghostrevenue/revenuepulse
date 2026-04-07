/**
 * RevenuePulse - Upsell Routes
 * CRUD operations for upsell offers
 */

import express from 'express';
import { 
  getOffers, 
  getOffer, 
  createOffer, 
  updateOffer, 
  deleteOffer, 
  duplicateOffer,
  getActiveOffers,
  getStore 
} from '../models/store.js';

const router = express.Router();

/**
 * GET /api/offers
 * List all offers for the authenticated store
 */
router.get('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const { status } = req.query;
    const offers = getOffers(store.id, status);

    res.json({
      success: true,
      offers,
      count: offers.length
    });
  } catch (error) {
    console.error('[Offers] List error:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

/**
 * GET /api/offers/active
 * List all active offers
 */
router.get('/active', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const offers = getActiveOffers(store.id);

    res.json({
      success: true,
      offers,
      count: offers.length
    });
  } catch (error) {
    console.error('[Offers] Active list error:', error);
    res.status(500).json({ error: 'Failed to fetch active offers' });
  }
});

/**
 * GET /api/offers/:id
 * Get a single offer by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const offer = getOffer(id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Verify ownership
    const store = getStore(req.session.storeDomain);
    if (!store || offer.store_id !== store.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      success: true,
      offer
    });
  } catch (error) {
    console.error('[Offers] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
});

/**
 * POST /api/offers
 * Create a new offer
 */
router.post('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const {
      name,
      description,
      status = 'draft',
      trigger_config = {},
      product_config = {},
      display_config = {},
      frequency_cap = {},
      schedule = {}
    } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Offer name is required' });
    }

    // Create the offer
    const offer = createOffer(store.id, {
      name: name.trim(),
      description: description?.trim() || '',
      status,
      trigger_config,
      product_config,
      display_config,
      frequency_cap,
      schedule
    });

    console.log(`[Offers] Created offer ${offer.id} for store ${store.id}`);

    res.status(201).json({
      success: true,
      offer
    });
  } catch (error) {
    console.error('[Offers] Create error:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

/**
 * PUT /api/offers/:id
 * Update an existing offer
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const store = getStore(req.session.storeDomain);

    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    // Verify offer exists and belongs to store
    const existingOffer = getOffer(id);
    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    if (existingOffer.store_id !== store.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      name,
      description,
      status,
      trigger_config,
      product_config,
      display_config,
      frequency_cap,
      schedule
    } = req.body;

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (trigger_config !== undefined) updateData.trigger_config = trigger_config;
    if (product_config !== undefined) updateData.product_config = product_config;
    if (display_config !== undefined) updateData.display_config = display_config;
    if (frequency_cap !== undefined) updateData.frequency_cap = frequency_cap;
    if (schedule !== undefined) updateData.schedule = schedule;

    // Perform update
    updateOffer(id, updateData);

    // Fetch updated offer
    const updatedOffer = getOffer(id);

    console.log(`[Offers] Updated offer ${id}`);

    res.json({
      success: true,
      offer: updatedOffer
    });
  } catch (error) {
    console.error('[Offers] Update error:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

/**
 * DELETE /api/offers/:id
 * Delete an offer
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const store = getStore(req.session.storeDomain);

    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    // Verify offer exists and belongs to store
    const existingOffer = getOffer(id);
    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    if (existingOffer.store_id !== store.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    deleteOffer(id);

    console.log(`[Offers] Deleted offer ${id}`);

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('[Offers] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete offer' });
  }
});

/**
 * POST /api/offers/:id/duplicate
 * Duplicate an existing offer
 */
router.post('/:id/duplicate', (req, res) => {
  try {
    const { id } = req.params;
    const store = getStore(req.session.storeDomain);

    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    // Verify offer exists and belongs to store
    const existingOffer = getOffer(id);
    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    if (existingOffer.store_id !== store.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { newName } = req.body;
    const duplicated = duplicateOffer(id, newName);

    console.log(`[Offers] Duplicated offer ${id} to ${duplicated.id}`);

    res.status(201).json({
      success: true,
      offer: duplicated
    });
  } catch (error) {
    console.error('[Offers] Duplicate error:', error);
    res.status(500).json({ error: 'Failed to duplicate offer' });
  }
});

/**
 * POST /api/offers/:id/activate
 * Activate an offer
 */
router.post('/:id/activate', (req, res) => {
  try {
    const { id } = req.params;
    const store = getStore(req.session.storeDomain);

    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const existingOffer = getOffer(id);
    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    if (existingOffer.store_id !== store.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    updateOffer(id, { status: 'active' });

    res.json({
      success: true,
      offer: getOffer(id)
    });
  } catch (error) {
    console.error('[Offers] Activate error:', error);
    res.status(500).json({ error: 'Failed to activate offer' });
  }
});

/**
 * POST /api/offers/:id/pause
 * Pause an offer
 */
router.post('/:id/pause', (req, res) => {
  try {
    const { id } = req.params;
    const store = getStore(req.session.storeDomain);

    if (!store) {
      return res.status(401).json({ error: 'Store not found' });
    }

    const existingOffer = getOffer(id);
    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    if (existingOffer.store_id !== store.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    updateOffer(id, { status: 'paused' });

    res.json({
      success: true,
      offer: getOffer(id)
    });
  } catch (error) {
    console.error('[Offers] Pause error:', error);
    res.status(500).json({ error: 'Failed to pause offer' });
  }
});

export default router;
