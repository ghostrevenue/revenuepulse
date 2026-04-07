// Exit Intent Detection Service
// Handles logic for determining when to show exit intent modals

export function shouldShowExitIntent(visitorSession, campaign, now = Date.now()) {
  if (!visitorSession || !campaign) return false;
  if (campaign.status !== 'active') return false;
  if (campaign.type !== 'exit-intent') return false;
  
  const triggerConfig = campaign.trigger_config || {};
  
  // Check session frequency
  if (triggerConfig.session_frequency === 'once' && visitorSession.exit_intent_shown) {
    return false;
  }
  
  // Check delay
  const delayMs = triggerConfig.delay_ms || 5000;
  const timeOnPage = now - (visitorSession.page_load_time || now);
  if (timeOnPage < delayMs) return false;
  
  return true;
}

export function markExitIntentShown(visitorSession) {
  return { ...visitorSession, exit_intent_shown: true };
}

export function getExitIntentConfig(campaign) {
  return {
    headline: campaign.display_config?.headline || 'Wait! Don\'t Leave!',
    subtext: campaign.display_config?.subtext || 'Get 10% off your first order when you stay.',
    button_text: campaign.display_config?.button_text || 'Stay & Save',
    offer_type: campaign.offer_config?.type || 'percentage',
    offer_value: campaign.offer_config?.value || 10,
    coupon_code: campaign.offer_config?.coupon_code || null,
    auto_apply: campaign.offer_config?.auto_apply || false
  };
}

export function validateExitIntentTrigger(triggerConfig) {
  const errors = [];
  
  if (triggerConfig.delay_ms !== undefined) {
    if (typeof triggerConfig.delay_ms !== 'number' || triggerConfig.delay_ms < 0) {
      errors.push('delay_ms must be a non-negative number');
    }
    if (triggerConfig.delay_ms > 60000) {
      errors.push('delay_ms cannot exceed 60000ms (1 minute)');
    }
  }
  
  if (triggerConfig.session_frequency) {
    if (!['once', 'always', 'once_per_hour'].includes(triggerConfig.session_frequency)) {
      errors.push('session_frequency must be one of: once, always, once_per_hour');
    }
  }
  
  return errors;
}
