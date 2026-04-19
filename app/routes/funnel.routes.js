import { Router } from 'express';
import db from '../models/db.js';
import { v4 as uuidv4 } from 'uuid';
import { verifyShop } from './upsell.routes.js';

const router = Router();

// All routes require auth
router.use(verifyShop);

// Helper: run a db statement (handles Postgres $N vs SQLite ?)
// All return Promises so callers must await them
async function dbRun(sql, params) {
  if (db.usePostgres) {
    // Postgres: convert ? to $1, $2, ... for the prepare interface
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    return db.prepare(pgSql).run(...params);
  }
  return db.prepare(sql).run(...params);
}
async function dbGet(sql, params) {
  if (db.usePostgres) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    return db.prepare(pgSql).get(...params);
  }
  return db.prepare(sql).get(...params);
}
async function dbAll(sql, params) {
  if (db.usePostgres) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    return db.prepare(pgSql).all(...params);
  }
  return db.prepare(sql).all(...params);
}

// GET /api/funnels — list all funnels
router.get('/', async (req, res) => {
  try {
    await db.ensureReady();
    const sql = "SELECT * FROM funnels WHERE store_id = ? ORDER BY updated_at DESC";
    const rows = await dbAll(sql, [req.store.id]);
    const funnels = rows.map(f => ({
      ...f,
      trigger: f.trigger_json ? JSON.parse(f.trigger_json) : { conditions: [], match: 'all' },
      nodes: f.nodes_json ? JSON.parse(f.nodes_json) : [],
    }));
    res.json({ funnels });
  } catch (err) {
    console.error('GET /api/funnels error:', err);
    res.status(500).json({ error: 'Failed to fetch funnels' });
  }
});

// POST /api/funnels — create funnel
router.post('/', async (req, res) => {
  try {
    await db.ensureReady();
    const { name, trigger, nodes } = req.body;
    const id = uuidv4();
    const triggerJson = JSON.stringify(trigger || { conditions: [], match: 'all' });
    const nodesJson = JSON.stringify(nodes || []);

    const sql = `INSERT INTO funnels (id, store_id, name, trigger_json, nodes_json) VALUES (?, ?, ?, ?, ?)`;
    await dbRun(sql, [id, req.store.id, name || 'Untitled Funnel', triggerJson, nodesJson]);

    const sqlGet = "SELECT * FROM funnels WHERE id = ?";
    const f = await dbGet(sqlGet, [id]);
    res.json({
      funnel: {
        ...f,
        trigger: f.trigger_json ? JSON.parse(f.trigger_json) : { conditions: [], match: 'all' },
        nodes: f.nodes_json ? JSON.parse(f.nodes_json) : [],
      }
    });
  } catch (err) {
    console.error('POST /api/funnels error:', err);
    res.status(500).json({ error: 'Failed to create funnel' });
  }
});

// GET /api/funnels/:id — get funnel
router.get('/:id', async (req, res) => {
  try {
    await db.ensureReady();
    const sql = "SELECT * FROM funnels WHERE id = ? AND store_id = ?";
    const f = await dbGet(sql, [req.params.id, req.store.id]);
    if (!f) return res.status(404).json({ error: 'Funnel not found' });
    res.json({
      funnel: {
        ...f,
        trigger: f.trigger_json ? JSON.parse(f.trigger_json) : { conditions: [], match: 'all' },
        nodes: f.nodes_json ? JSON.parse(f.nodes_json) : [],
      }
    });
  } catch (err) {
    console.error('GET /api/funnels/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch funnel' });
  }
});

// PUT /api/funnels/:id — update funnel
router.put('/:id', async (req, res) => {
  try {
    await db.ensureReady();
    const { name, status, trigger, nodes } = req.body;
    const sql = "SELECT * FROM funnels WHERE id = ? AND store_id = ?";
    const existing = await dbGet(sql, [req.params.id, req.store.id]);
    if (!existing) return res.status(404).json({ error: 'Funnel not found' });

    const updatedName = name ?? existing.name;
    const updatedStatus = status ?? existing.status;
    const updatedTrigger = JSON.stringify(trigger ?? JSON.parse(existing.trigger_json || '{}'));
    const updatedNodes = JSON.stringify(nodes ?? JSON.parse(existing.nodes_json || '[]'));

    await dbRun(
      "UPDATE funnels SET name = ?, status = ?, trigger_json = ?, nodes_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?",
      [updatedName, updatedStatus, updatedTrigger, updatedNodes, req.params.id, req.store.id]
    );

    const f = await dbGet("SELECT * FROM funnels WHERE id = ?", [req.params.id]);
    res.json({
      funnel: {
        ...f,
        trigger: f.trigger_json ? JSON.parse(f.trigger_json) : { conditions: [], match: 'all' },
        nodes: f.nodes_json ? JSON.parse(f.nodes_json) : [],
      }
    });
  } catch (err) {
    console.error('PUT /api/funnels/:id error:', err);
    res.status(500).json({ error: 'Failed to update funnel' });
  }
});

// DELETE /api/funnels/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.ensureReady();
    await dbRun("DELETE FROM funnels WHERE id = ? AND store_id = ?", [req.params.id, req.store.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/funnels/:id error:', err);
    res.status(500).json({ error: 'Failed to delete funnel' });
  }
});

// POST /api/funnels/:id/publish — set active
router.post('/:id/publish', async (req, res) => {
  try {
    await db.ensureReady();
    await dbRun("UPDATE funnels SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?", [req.params.id, req.store.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish funnel' });
  }
});

// POST /api/funnels/:id/unpublish — set draft
router.post('/:id/unpublish', async (req, res) => {
  try {
    await db.ensureReady();
    await dbRun("UPDATE funnels SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?", [req.params.id, req.store.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unpublish funnel' });
  }
});

// GET /api/funnels/:id/analytics — per-node metrics
router.get('/:id/analytics', async (req, res) => {
  try {
    await db.ensureReady();
    const funnel = await dbGet("SELECT * FROM funnels WHERE id = ? AND store_id = ?", [req.params.id, req.store.id]);
    if (!funnel) return res.status(404).json({ error: 'Funnel not found' });

    const rows = await dbAll("SELECT * FROM funnel_events WHERE funnel_id = ? ORDER BY created_at DESC LIMIT 10000", [req.params.id]);
    const nodes = JSON.parse(funnel.nodes_json || '[]');

    const nodeMetrics = {};
    nodes.forEach(n => {
      const nodeEvents = rows.filter(e => e.node_id === n.id);
      const impressions = nodeEvents.filter(e => e.event_type === 'impression').length;
      const accepts = nodeEvents.filter(e => e.event_type === 'accept').length;
      const declines = nodeEvents.filter(e => e.event_type === 'decline').length;
      const revenue = nodeEvents.filter(e => e.event_type === 'accept').reduce((sum, e) => sum + (e.amount || 0), 0);
      nodeMetrics[n.id] = { impressions, accepts, declines, revenue };
    });

    const totalImpressions = Object.values(nodeMetrics).reduce((s, m) => s + m.impressions, 0);
    const totalAccepts = Object.values(nodeMetrics).reduce((s, m) => s + m.accepts, 0);
    const totalDeclines = Object.values(nodeMetrics).reduce((s, m) => s + m.declines, 0);
    const totalRevenue = Object.values(nodeMetrics).reduce((s, m) => s + m.revenue, 0);

    res.json({
      funnel_id: req.params.id,
      impressions: totalImpressions,
      accepts: totalAccepts,
      declines: totalDeclines,
      revenue: totalRevenue,
      accept_rate: totalImpressions > 0 ? (totalAccepts / totalImpressions * 100).toFixed(1) : 0,
      node_metrics: nodeMetrics,
    });
  } catch (err) {
    console.error('GET /api/funnels/:id/analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/funnels/:id/events — record an event (called by extension)
router.post('/:id/events', async (req, res) => {
  try {
    await db.ensureReady();
    const { node_id, event_type, amount } = req.body;
    if (!['impression', 'accept', 'decline'].includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event_type' });
    }
    await dbRun(
      'INSERT INTO funnel_events (id, funnel_id, node_id, event_type, amount) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.params.id, node_id || null, event_type, amount || 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST funnel event error:', err);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

export default router;
