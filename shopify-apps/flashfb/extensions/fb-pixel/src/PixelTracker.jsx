export function PixelTracker(event, settings) {
  const { pixelId, accessToken, enabled } = settings;
  
  if (!enabled || !pixelId) {
    return;
  }

  const getFbp = () => {
    if (typeof document === 'undefined') return null;
    let fbp = document.cookie.match(/_fbp=([^;]+)/)?.[1];
    if (!fbp) {
      fbp = 'fb.' + Date.now() + '.' + Math.random().toString(36).substr(2, 9);
      document.cookie = `_fbp=${fbp}; path=/; max-age=15768000; SameSite=Lax`;
    }
    return fbp;
  };

  const getFbc = () => {
    if (typeof document === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('fbclid') ? `fb.1.${Date.now()}.${urlParams.get('fbclid')}` : null;
  };

  const fbp = getFbp();
  const fbc = getFbc();

  const eventData = {
    event_name: event.name,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_data: { fbp, fbc },
    custom_data: event.customData
  };

  // Send to Meta Conversions API via app backend
  if (accessToken && typeof fetch !== 'undefined') {
    fetch('/api/events/' + (window.__FLASHFB_STORE_ID || 'demo-store'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: event.name,
        event_source: 'pixel',
        fbp,
        fbc,
        value: event.customData?.value,
        currency: event.customData?.currency,
        order_id: event.customData?.order_id
      })
    }).catch(() => {});
  }

  // Fallback: fbq pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', event.name, event.customData, { fbp, fbc });
  }
}

export function trackEvent(name, data) {
  return PixelTracker({ name, customData: data }, window.__FLASHFB_PIXEL_CONFIG__);
}
