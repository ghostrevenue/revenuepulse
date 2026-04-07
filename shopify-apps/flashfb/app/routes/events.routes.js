import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { saveEvent, getEventsByStore, getEventsByOrder, getEventStats, getTodayStats } from '../event.js';
import { checkDuplicate } from '../services/deduplication.service.js';

const router = express.Router();

router.get('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const { limit = 100 } = req.query;
  const events = getEventsByStore(storeId, parseInt(limit));
  res.json({ events });
});

router.get('/:storeId/stats', (req, res) => {
  const { storeId } = req.params;
  const { date } = req.query;
  const stats = date ? getEventStats(storeId, date) : getTodayStats(storeId);
  res.json({ stats });
});

router.get('/:storeId/order/:orderId', (req, res) => {
  const { storeId, orderId } = req.params;
  const events = getEventsByOrder(storeId, orderId);
  res.json({ events });
});

router.post('/:storeId', (req, res) => {
  const { storeId } = req.params;
  const { event_name, event_source, fbp, fbc, value, currency, order_id, payload } = req.body;

  const event = {
    store_id: storeId,
    event_id: uuidv4(),
    event_name,
    event_source: event_source || 'pixel',
    fbp,
    fbc,
    value: value || 0,
    currency: currency || 'USD',
    order_id,
    deduplicated: false,
    payload: typeof payload === 'string' ? payload : JSON.stringify(payload)
  };

  // Check for duplicate if order_id exists
  if (order_id) {
    const existingEvents = getEventsByOrder(storeId, order_id);
    const duplicate = checkDuplicate(existingEvents, event);
    if (duplicate) {
      event.deduplicated = true;
    }
  }

  const id = saveEvent(event);
  res.json({ success: true, id, deduplicated: event.deduplicated });
});

export default router;
