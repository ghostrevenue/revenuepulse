import { createCampaign, getCampaign, getCampaigns, updateCampaign } from '../models/campaign.js';

export function createExitIntentCampaign(storeId, name, offerConfig, displayConfig) {
  return createCampaign({
    store_id: storeId,
    name,
    type: 'exit-intent',
    trigger_config: { trigger_type: 'mouse_exit', delay_ms: 5000, session_frequency: 'once' },
    offer_config: offerConfig,
    display_config: displayConfig || { headline: 'Wait! Don\'t Leave!', button_text: 'Stay & Save' }
  });
}

export function createAbandonedCartCampaign(storeId, name, offerConfig, triggerConfig) {
  return createCampaign({
    store_id: storeId,
    name,
    type: 'abandoned-cart',
    trigger_config: triggerConfig || { abandon_timeout_minutes: 30 },
    offer_config: offerConfig,
    display_config: { headline: 'Forgot Something?', button_text: 'Recover My Cart' }
  });
}

export function createPriceThresholdCampaign(storeId, name, minCartValue, offerConfig) {
  return createCampaign({
    store_id: storeId,
    name,
    type: 'price-threshold',
    trigger_config: { min_cart_value: minCartValue },
    offer_config: offerConfig,
    display_config: { headline: 'You Qualify for a Discount!', button_text: 'Apply Discount' }
  });
}

export function getActiveCampaigns(storeId) {
  return getCampaigns(storeId, 'active');
}

export function getCampaignsByType(storeId, type) {
  return getCampaigns(storeId).filter(c => c.type === type);
}

export function pauseCampaign(campaignId) {
  return updateCampaign(campaignId, { status: 'paused' });
}

export function activateCampaign(campaignId) {
  return updateCampaign(campaignId, { status: 'active' });
}

export function duplicateCampaign(campaignId) {
  const original = getCampaign(campaignId);
  if (!original) return null;
  
  return createCampaign({
    store_id: original.store_id,
    name: `${original.name} (Copy)`,
    type: original.type,
    status: 'draft',
    trigger_config: original.trigger_config,
    offer_config: original.offer_config,
    display_config: original.display_config
  });
}
