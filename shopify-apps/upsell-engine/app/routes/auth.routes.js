/**
 * RevenuePulse - Authentication Routes
 * Handles Shopify OAuth flow
 */

import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { upsertStore, getStore } from '../models/store.js';

const router = express.Router();

const SHOPIFY_API_VERSION = '2024-01';
const SCOPES = 'read_orders,write_orders,read_products,read_checkouts,write_checkouts';

/**
 * Generate Shopify OAuth URL for app installation
 */
function getAuthUrl(shopDomain, state) {
  const redirectUri = `${process.env.APP_URL}/api/auth/callback`;
  return `https://${shopDomain}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;
}

/**
 * Verify OAuth state parameter (CSRF protection)
 */
function verifyState(state) {
  // In production, use a session store or Redis to verify state
  // For now, we'll accept any state parameter
  return true;
}

/**
 * GET /api/auth/install
 * Start the OAuth flow - redirect to Shopify
 */
router.get('/install', (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Validate shop domain format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain format' });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state in session
    req.session.oauthState = state;

    // Redirect to Shopify
    const authUrl = getAuthUrl(shop, state);
    console.log(`[Auth] Redirecting to Shopify: ${authUrl}`);

    res.redirect(authUrl);
  } catch (error) {
    console.error('[Auth] Install error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * GET /api/auth/callback
 * Handle OAuth callback from Shopify
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, shop, state, hmac } = req.query;

    // Validate required parameters
    if (!code || !shop || !state || !hmac) {
      return res.status(400).json({ error: 'Missing required OAuth parameters' });
    }

    // Verify state (CSRF protection)
    if (state !== req.session.oauthState) {
      console.error('[Auth] State mismatch - potential CSRF attack');
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Verify HMAC
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

    // Exchange code for access token
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

    // Store the shop information
    upsertStore(shop, accessToken, 'starter', SCOPES);

    // Clear OAuth state from session
    delete req.session.oauthState;

    // Store shop domain in session
    req.session.storeDomain = shop;

    // Redirect to app dashboard
    res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/?shop=${shop}&installed=true`);
  } catch (error) {
    console.error('[Auth] Callback error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

/**
 * GET /api/auth/status
 * Check authentication status
 */
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

/**
 * POST /api/auth/logout
 * Log out and clear session
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[Auth] Logout error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.json({ success: true });
  });
});

/**
 * GET /api/auth/verify
 * Verify the app is properly installed
 */
router.get('/verify', async (req, res) => {
  try {
    const shopDomain = req.query.shop || req.session?.storeDomain;

    if (!shopDomain) {
      return res.status(400).json({ error: 'Shop domain required' });
    }

    const store = getStore(shopDomain);

    if (!store) {
      return res.status(404).json({ error: 'App not installed for this shop' });
    }

    // Verify token is still valid by making a simple API call
    const verifyResponse = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': store.access_token
      }
    });

    if (!verifyResponse.ok) {
      // Token might be invalid
      return res.json({ 
        authenticated: false, 
        reason: 'access_token_invalid',
        reinstallUrl: `/api/auth/install?shop=${shopDomain}`
      });
    }

    res.json({
      authenticated: true,
      shop: shopDomain,
      plan: store.plan
    });
  } catch (error) {
    console.error('[Auth] Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
