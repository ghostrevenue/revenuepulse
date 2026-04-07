import express from 'express';

const router = express.Router();

// Mock OAuth endpoints - in production these integrate with Shopify OAuth
router.get('/login', (req, res) => {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter required' });
  }
  
  // Redirect to Shopify OAuth
  const redirectUri = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
  const scope = process.env.SHOPIFY_SCOPES || 'read_customers,read_orders';
  
  res.redirect(`https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scope}&redirect_uri=${redirectUri}`);
});

router.get('/callback', (req, res) => {
  const { code, shop, hmac } = req.query;
  
  if (!shop || !code) {
    return res.status(400).json({ error: 'Invalid callback parameters' });
  }
  
  // In production: validate hmac, exchange code for access token
  // For now, store the shop and redirect to app
  req.db.prepare('INSERT OR IGNORE INTO stores (shop) VALUES (?)').run(shop);
  
  res.redirect(`/?shop=${shop}&embedded=0`);
});

router.get('/online', (req, res) => {
  // Embedded app entry point
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter required' });
  }
  
  res.json({ 
    message: 'DataVault App',
    shop,
    embedded: true 
  });
});

export default router;
