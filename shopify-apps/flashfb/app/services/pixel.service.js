export async function sendPixelEvent(pixelId, accessToken, eventData) {
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

export async function sendTestEvent(pixelId, accessToken, testCode = 'TEST12345') {
  return sendPixelEvent(pixelId, accessToken, {
    event_name: 'TestEvent',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_data: {
      fbp: 'fb.1.test',
      fbc: 'fb.1.test'
    },
    test_event_code: testCode
  });
}

export async function sendBusinessEvent(pixelId, accessToken, event) {
  return sendPixelEvent(pixelId, accessToken, {
    event_name: event.event_name,
    event_time: event.event_time || Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_data: {
      fbp: event.fbp,
      fbc: event.fbc,
      client_ip_address: event.client_ip,
      client_user_agent: event.client_user_agent
    },
    user_data: event.user_data,
    custom_data: event.custom_data,
    event_id: event.event_id
  });
}
