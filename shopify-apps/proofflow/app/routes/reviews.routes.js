/**
 * ProofFlow - Reviews Routes
 * Review CRUD operations
 */

import express from 'express';
import { getStore } from '../models/store.js';
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  replyToReview,
  incrementHelpfulCount,
  getReviewsStats
} from '../models/review.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session || !req.session.storeDomain) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAuth);

router.get('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const filters = {
      product_id: req.query.product_id,
      rating: req.query.rating ? parseInt(req.query.rating) : undefined,
      verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
      is_public: req.query.is_public === 'true' ? true : req.query.is_public === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const reviews = getReviews(store.id, filters);
    const stats = getReviewsStats(store.id);

    res.json({
      success: true,
      reviews,
      stats,
      pagination: {
        limit: filters.limit,
        offset: filters.offset
      }
    });
  } catch (error) {
    console.error('[Reviews] List error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const stats = getReviewsStats(store.id);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[Reviews] Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const review = getReviewById(parseInt(req.params.id));
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, review });
  } catch (error) {
    console.error('[Reviews] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

router.post('/', (req, res) => {
  try {
    const store = getStore(req.session.storeDomain);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { product_id, rating, title, body, author_name, author_email, verified, photos, is_public } = req.body;

    if (!product_id || !rating || !author_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = createReview({
      store_id: store.id,
      product_id,
      rating,
      title,
      body,
      author_name,
      author_email,
      verified,
      photos,
      is_public
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('[Reviews] Create error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const review = getReviewById(parseInt(req.params.id));
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { rating, title, body, photos, is_public, is_featured } = req.body;

    updateReview(review.id, { rating, title, body, photos, is_public, is_featured });

    const updated = getReviewById(review.id);
    res.json({ success: true, review: updated });
  } catch (error) {
    console.error('[Reviews] Update error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const review = getReviewById(parseInt(req.params.id));
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    deleteReview(review.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Reviews] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

router.post('/:id/reply', (req, res) => {
  try {
    const review = getReviewById(parseInt(req.params.id));
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { reply_text } = req.body;
    if (!reply_text) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    replyToReview(review.id, reply_text);
    const updated = getReviewById(review.id);

    res.json({ success: true, review: updated });
  } catch (error) {
    console.error('[Reviews] Reply error:', error);
    res.status(500).json({ error: 'Failed to reply to review' });
  }
});

router.post('/:id/helpful', (req, res) => {
  try {
    const review = getReviewById(parseInt(req.params.id));
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    incrementHelpfulCount(review.id);
    const updated = getReviewById(review.id);

    res.json({ success: true, helpful_count: updated.helpful_count });
  } catch (error) {
    console.error('[Reviews] Helpful error:', error);
    res.status(500).json({ error: 'Failed to mark helpful' });
  }
});

export default router;
