import fetch from 'node-fetch';

export async function sendConversionEvent(pixelId, accessToken, eventData) {
  const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [eventData],
      test_event_code: eventData.test_event_code
    })
  });

  return response.json();
}

export async function sendServerEvent(pixelId, accessToken, event) {
  // Meta Conversions API server-side event
  return sendConversionEvent(pixelId, accessToken, {
    event_name: event.event_name,
    event_time: event.event_time || Math.floor(Date.now() / 1000),
    action_source: event.action_source || 'website',
    event_source_data: {
      fbp: event.fbp,
      fbc: event.fbc,
      client_ip_address: event.client_ip,
      client_user_agent: event.client_user_agent
    },
    user_data: {
      em: event.email_hash,       // SHA256 hashed email
      ph: event.phone_hash,      // SHA256 hashed phone
      fn: event.first_name_hash,
      ln: event.last_name_hash,
      address: event.address_hash
    },
    custom_data: {
      value: event.value,
      currency: event.currency,
      content_ids: event.content_ids,
      contents: event.contents,
      order_id: event.order_id
    },
    event_id: event.event_id,
    data_options: {
      set_secure: true
    }
  });
}

export async function testConnection(pixelId, accessToken) {
  return sendConversionEvent(pixelId, accessToken, {
    event_name: 'TestEvent',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    test_event_code: 'TEST12345'
  });
}
