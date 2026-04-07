import { getDB, uuid } from './db.js';

export function createCampaign(data) {
  const db = getDB();
  const id = data.id || uuid();
  const stmt = db.prepare(`
    INSERT INTO campaigns (id, store_id, name, type, status, trigger_config, offer_config, display_config, stats)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.store_id,
    data.name,
    data.type,
    data.status || 'draft',
    JSON.stringify(data.trigger_config || {}),
    JSON.stringify(data.offer_config || {}),
    JSON.stringify(data.display_config || {}),
    JSON.stringify(data.stats || { impressions: 0, conversions: 0, revenue: 0 })
  );
  return getCampaign(id);
}

export function getCampaign(id) {
  const db = getDB();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (campaign) {
    campaign.trigger_config = JSON.parse(campaign.trigger_config || '{}');
    campaign.offer_config = JSON.parse(campaign.offer_config || '{}');
    campaign.display_config = JSON.parse(campaign.display_config || '{}');
    campaign.stats = JSON.parse(campaign.stats || '{}');
  }
  return campaign;
}

export function getCampaigns(storeId, status) {
  const db = getDB();
  let sql = 'SELECT * FROM campaigns WHERE store_id = ?';
  const params = [storeId];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return rows.map(row => {
    row.trigger_config = JSON.parse(row.trigger_config || '{}');
    row.offer_config = JSON.parse(row.offer_config || '{}');
    row.display_config = JSON.parse(row.display_config || '{}');
    row.stats = JSON.parse(row.stats || '{}');
    return row;
  });
}

export function updateCampaign(id, data) {
  const db = getDB();
  const fields = [];
  const values = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.trigger_config !== undefined) { fields.push('trigger_config = ?'); values.push(JSON.stringify(data.trigger_config)); }
  if (data.offer_config !== undefined) { fields.push('offer_config = ?'); values.push(JSON.stringify(data.offer_config)); }
  if (data.display_config !== undefined) { fields.push('display_config = ?'); values.push(JSON.stringify(data.display_config)); }
  if (data.stats !== undefined) { fields.push('stats = ?'); values.push(JSON.stringify(data.stats)); }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  if (fields.length === 0) return getCampaign(id);
  values.push(id);
  db.prepare(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCampaign(id);
}

export function deleteCampaign(id) {
  const db = getDB();
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
}

export function incrementCampaignStats(id, field, value = 1) {
  const db = getDB();
  const campaign = getCampaign(id);
  if (!campaign) return;
  campaign.stats = campaign.stats || {};
  campaign.stats[field] = (campaign.stats[field] || 0) + value;
  db.prepare('UPDATE campaigns SET stats = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(JSON.stringify(campaign.stats), id);
}
