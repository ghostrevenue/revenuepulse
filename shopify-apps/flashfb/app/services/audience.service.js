import fetch from 'node-fetch';
import { createAudience, getAudiencesByStore, updateAudience, updateAudienceSize } from '../audience.js';

export async function syncAudienceToFacebook(storeId, audienceId, pixelId, accessToken) {
  const audience = getAudiencesByStore(storeId).find(a => a.id === audienceId);
  if (!audience) {
    throw new Error('Audience not found');
  }

  // Create custom audience via Meta Graph API
  const response = await fetch(`https://graph.facebook.com/v18.0/me/customaudiences?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: audience.name,
      description: `Shopify audience: ${audience.name}`,
      subtype: audience.audience_type === 'lookalike' ? 'LOOKALIKE' : 'CUSTOM',
      customer_file_source: 'USER_PROVIDED_ONLY',
      retention_days: audience.rules?.retention_days || 30
    })
  });

  const data = await response.json();
  if (data.id) {
    updateAudienceSize(audienceId, 0);
    return { success: true, fb_audience_id: data.id };
  }

  throw new Error(data.error?.message || 'Failed to sync audience');
}

export async function addUsersToAudience(fbAudienceId, users, accessToken) {
  // Users should be SHA256 hashed emails/phones
  const response = await fetch(`https://graph.facebook.com/v18.0/${fbAudienceId}/users?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      users: users.map(u => ({
        email: u.email_hash,
        phone: u.phone_hash
      }))
    })
  });

  return response.json();
}

export async function createLookalikeAudience(fbAudienceId, accessToken, options = {}) {
  const { scale = 0.01, country = 'US' } = options;

  const response = await fetch(`https://graph.facebook.com/v18.0/me/customaudiences?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Lookalike-${Date.now()}`,
      description: 'Shopify lookalike audience',
      subtype: 'LOOKALIKE',
      lookalike_spec: {
        type: 'custom_audience',
        origin_audience_id: fbAudienceId,
        ratio: scale,
        country
      }
    })
  });

  return response.json();
}
