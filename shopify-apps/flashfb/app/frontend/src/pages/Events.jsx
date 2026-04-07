import React, { useState, useEffect } from 'react';

function Events({ storeId }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetch(`/api/events/${storeId}?limit=50`)
      .then(r => r.json())
      .then(data => setEvents(data.events || []))
      .catch(() => {});
  }, [storeId]);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Event Log</h2>
      
      <div style={{ background: '#13131a', borderRadius: 12, padding: 24, border: '1px solid #2a2a3a', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
          <InfoCard title="Total Events" value={events.length} />
          <InfoCard title="From Pixel" value={events.filter(e => e.event_source === 'pixel').length} />
          <InfoCard title="From CAPI" value={events.filter(e => e.event_source === 'capi').length} />
          <InfoCard title="Deduplicated" value={events.filter(e => e.deduplicated).length} />
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Events</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {events.length > 0 ? events.map(e => (
          <div key={e.id} onClick={() => setSelectedEvent(e)} style={{ 
            background: '#13131a', borderRadius: 8, padding: 12, border: '1px solid #2a2a3a', 
            cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center' 
          }}>
            <span style={{ 
              padding: '4px 8px', borderRadius: 4, fontSize: 12,
              background: e.event_source === 'pixel' ? '#3b82f6' : '#22c55e',
              color: '#fff'
            }}>{e.event_source}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{e.event_name}</span>
            <span style={{ color: '#888', fontSize: 12 }}>{e.value ? `$${e.value}` : ''}</span>
            <span style={{ color: e.deduplicated ? '#ef4444' : '#22c55e', fontSize: 12 }}>
              {e.deduplicated ? 'Deduplicated' : 'Unique'}
            </span>
          </div>
        )) : (
          <p style={{ color: '#888' }}>No events logged yet</p>
        )}
      </div>

      {selectedEvent && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setSelectedEvent(null)}>
          <div style={{ background: '#13131a', borderRadius: 12, padding: 24, maxWidth: 600, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Event Details</h3>
            <pre style={{ background: '#0a0a0f', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
              {JSON.stringify(selectedEvent, null, 2)}
            </pre>
            <button onClick={() => setSelectedEvent(null)} style={{ ...buttonStyle, marginTop: 16, background: '#6366f1' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div style={{ background: '#0a0a0f', borderRadius: 8, padding: 16 }}>
      <p style={{ fontSize: 12, color: '#888' }}>{title}</p>
      <p style={{ fontSize: 24, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

const buttonStyle = { padding: '12px 24px', borderRadius: 8, border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' };

export default Events;
