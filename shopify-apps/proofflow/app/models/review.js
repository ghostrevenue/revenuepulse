/**
 * ProofFlow - Review Model
 * Review CRUD operations
 */

import { getDb } from './db.js';

export function createReview(reviewData) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO reviews (store_id, product_id, rating, title, body, author_name, author_email, verified, photos, is_public, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    reviewData.store_id,
    reviewData.product_id,
    reviewData.rating,
    reviewData.title || '',
    reviewData.body || '',
    reviewData.author_name,
    reviewData.author_email || '',
    reviewData.verified ? 1 : 0,
    JSON.stringify(reviewData.photos || []),
    reviewData.is_public !== false ? 1 : 0,
    reviewData.is_featured ? 1 : 0
  );
  
  return { id: result.lastInsertRowid, ...reviewData };
}

export function getReviews(storeId, filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM reviews WHERE store_id = ?';
  const params = [storeId];
  
  if (filters.product_id) {
    query += ' AND product_id = ?';
    params.push(filters.product_id);
  }
  
  if (filters.rating) {
    query += ' AND rating = ?';
    params.push(filters.rating);
  }
  
  if (filters.verified !== undefined) {
    query += ' AND verified = ?';
    params.push(filters.verified ? 1 : 0);
  }
  
  if (filters.is_public !== undefined) {
    query += ' AND is_public = ?';
    params.push(filters.is_public ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  
  if (filters.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }
  
  const stmt = db.prepare(query);
  const reviews = stmt.all(...params);
  
  return reviews.map(review => ({
    ...review,
    photos: JSON.parse(review.photos || '[]'),
    verified: !!review.verified,
    is_public: !!review.is_public,
    is_featured: !!review.is_featured
  }));
}

export function getReviewById(reviewId) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM reviews WHERE id = ?');
  const review = stmt.get(reviewId);
  
  if (!review) return null;
  
  return {
    ...review,
    photos: JSON.parse(review.photos || '[]'),
    verified: !!review.verified,
    is_public: !!review.is_public,
    is_featured: !!review.is_featured
  };
}

export function updateReview(reviewId, reviewData) {
  const db = getDb();
  const fields = [];
  const values = [];
  
  if (reviewData.rating !== undefined) {
    fields.push('rating = ?');
    values.push(reviewData.rating);
  }
  if (reviewData.title !== undefined) {
    fields.push('title = ?');
    values.push(reviewData.title);
  }
  if (reviewData.body !== undefined) {
    fields.push('body = ?');
    values.push(reviewData.body);
  }
  if (reviewData.photos !== undefined) {
    fields.push('photos = ?');
    values.push(JSON.stringify(reviewData.photos));
  }
  if (reviewData.is_public !== undefined) {
    fields.push('is_public = ?');
    values.push(reviewData.is_public ? 1 : 0);
  }
  if (reviewData.is_featured !== undefined) {
    fields.push('is_featured = ?');
    values.push(reviewData.is_featured ? 1 : 0);
  }
  if (reviewData.reply_text !== undefined) {
    fields.push('reply_text = ?');
    values.push(reviewData.reply_text);
    fields.push('replied_at = CURRENT_TIMESTAMP');
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(reviewId);
  
  const stmt = db.prepare(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
}

export function deleteReview(reviewId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM reviews WHERE id = ?');
  return stmt.run(reviewId);
}

export function replyToReview(reviewId, replyText) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE reviews 
    SET reply_text = ?, replied_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(replyText, reviewId);
}

export function incrementHelpfulCount(reviewId) {
  const db = getDb();
  const stmt = db.prepare('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?');
  return stmt.run(reviewId);
}

export function getReviewsStats(storeId) {
  const db = getDb();
  
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE store_id = ?');
  const total = totalStmt.get(storeId).count;
  
  const avgStmt = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE store_id = ? AND is_public = 1');
  const avgResult = avgStmt.get(storeId);
  const avgRating = avgResult.avg ? parseFloat(avgResult.avg.toFixed(1)) : 0;
  
  const distributionStmt = db.prepare(`
    SELECT rating, COUNT(*) as count 
    FROM reviews 
    WHERE store_id = ? 
    GROUP BY rating
  `);
  const distribution = distributionStmt.all(storeId);
  
  const distributionMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(d => {
    distributionMap[d.rating] = d.count;
  });
  
  const verifiedStmt = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE store_id = ? AND verified = 1');
  const verified = verifiedStmt.get(storeId).count;
  
  const thisMonthStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM reviews 
    WHERE store_id = ? 
    AND created_at >= date('now', 'start of month')
  `);
  const thisMonth = thisMonthStmt.get(storeId).count;
  
  return {
    total,
    averageRating: avgRating,
    distribution: distributionMap,
    verified,
    thisMonth
  };
}

export function getReviewsByProduct(storeId, productId) {
  return getReviews(storeId, { product_id: productId, is_public: true });
}

export default {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  replyToReview,
  incrementHelpfulCount,
  getReviewsStats,
  getReviewsByProduct
};
