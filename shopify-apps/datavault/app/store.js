export function loadStore(req, db) {
  const shop = req.query.shop;
  if (!shop) return null;
  
  let store = db.prepare('SELECT * FROM stores WHERE shop = ?').get(shop);
  
  if (!store) {
    const result = db.prepare('INSERT INTO stores (shop) VALUES (?)').run(shop);
    store = db.prepare('SELECT * FROM stores WHERE id = ?').get(result.lastInsertRowid);
  }
  
  return store;
}

export function getStoreByShop(db, shop) {
  return db.prepare('SELECT * FROM stores WHERE shop = ?').get(shop);
}
