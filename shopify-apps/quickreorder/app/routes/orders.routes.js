import express from 'express';
import SubscriptionOrder from '../models/order.js';

const router = express.Router();

// Get all orders for a store
router.get('/store/:storeId', (req, res) => {
  try {
    const orders = SubscriptionOrder.findByStore(parseInt(req.params.storeId));
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get pending orders
router.get('/store/:storeId/pending', (req, res) => {
  try {
    const orders = SubscriptionOrder.findPendingByStore(parseInt(req.params.storeId));
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

// Get orders by subscription
router.get('/subscription/:subscriptionId', (req, res) => {
  try {
    const orders = SubscriptionOrder.findBySubscription(parseInt(req.params.subscriptionId));
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching subscription orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', (req, res) => {
  try {
    const order = SubscriptionOrder.findById(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order
router.post('/', (req, res) => {
  try {
    const order = SubscriptionOrder.create(req.body);
    res.status(201).json({ order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'charged', 'shipped', 'failed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }
    
    const chargedAt = status === 'charged' ? new Date().toISOString() : null;
    SubscriptionOrder.updateStatus(parseInt(req.params.id), status, chargedAt);
    
    const order = SubscriptionOrder.findById(parseInt(req.params.id));
    res.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Retry failed order
router.post('/:id/retry', (req, res) => {
  try {
    const order = SubscriptionOrder.findById(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'failed') {
      return res.status(400).json({ error: 'Order is not failed' });
    }
    
    // Mark as pending for retry
    SubscriptionOrder.updateStatus(parseInt(req.params.id), 'pending');
    const updatedOrder = SubscriptionOrder.findById(parseInt(req.params.id));
    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Error retrying order:', error);
    res.status(500).json({ error: 'Failed to retry order' });
  }
});

export default router;
