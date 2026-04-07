/**
 * ProofFlow - Authentication Routes
 * Handles Shopify OAuth flow
 */

import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { upsertStore, getStore } from '../models/store.js';

const router = express.Router();

const SCOPES = 'read_products,write_products,read_orders,write_orders,read_customers';

function getAuthUrl(shopDomain, state) {
  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;
  return `https://${shopDomain}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;
}

router.get('/install', (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain format' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;

    const authUrl = getAuthUrl(shop, state);
    console.log(`[Auth] Redirecting to Shopify: ${authUrl}`);

    res.redirect(authUrl);
  } catch (error) {
    console.error('[Auth] Install error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code, shop, state, hmac } = req.query;

    if (!code || !shop || !state || !hmac) {
      return res.status(400).json({ error: 'Missing required OAuth parameters' });
    }

    if (state !== req.session.oauthState) {
      console.error('[Auth] State mismatch - potential CSRF attack');
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const secret = process.env.SHOPIFY_API_SECRET;
    const message = `code=${code}&shop=${shop}&state=${state}`;
    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    if (hmac !== generatedHash) {
      console.error('[Auth] HMAC verification failed');
      return res.status(400).json({ error: 'HMAC verification failed' });
    }

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: secret,
        code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log(`[Auth] Successfully obtained access token for ${shop}`);

    upsertStore(shop, accessToken, 'starter', SCOPES);

    delete req.session.oauthState;
    req.session.storeDomain = shop;

    res.redirect(`${process.env.APP_URL || 'http://localhost:3001'}/?shop=${shop}&installed=true`);
  } catch (error) {
    console.error('[Auth] Callback error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

router.get('/status', (req, res) => {
  try {
    const shopDomain = req.session?.storeDomain;

    if (!shopDomain) {
      return res.json({ authenticated: false });
    }

    const store = getStore(shopDomain);

    if (!store) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      shop: shopDomain,
      plan: store.plan,
      installedAt: store.created_at
    });
  } catch (error) {
    console.error('[Auth] Status error:', error);
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[Auth] Logout error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.json({ success: true });
  });
});

export default router;
