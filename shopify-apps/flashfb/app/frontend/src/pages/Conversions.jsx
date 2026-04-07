import React, { useState, useEffect } from 'react';

function Conversions({ storeId }) {
  const [conversions, setConversions] = useState([]);
  const [name, setName] = useState('');
  const [eventNames, setEventNames] = useState('');
  const [rules, setRules] = useState('');

  useEffect(() => {
    fetch(`/api/conversions/${storeId}`)
      .then(r => r.json())
      .then(data => setConversions(data.conversions || []))
      .catch(() => {});
  }, [storeId]);

  const handleCreate = async () => {
    if (!name) return;
    await fetch(`/api/conversions/${storeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, event_names: eventNames, rules })
    });
    setName('');
    setEventNames('');
    setRules('');
    const res = await fetch(`/api/conversions/${storeId}`);
    const data = await res.json();
    setConversions(data.conversions || []);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Custom Conversions</h2>
      
      <div style={{ background: '#13131a', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #2a2a3a' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create Conversion Rule</h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <input type="text" placeholder="Conversion Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Event Names (comma-separated)" value={eventNames} onChange={e => setEventNames(e.target.value)} style={inputStyle} />
          <textarea placeholder="Rules (JSON)" value={rules} onChange={e => setRules(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} />
          <button onClick={handleCreate} style={{ ...buttonStyle, background: '#6366f1', alignSelf: 'flex-start' }}>Create</button>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Conversions</h3>
      {conversions.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {conversions.map(c => (
            <div key={c.id} style={{ background: '#13131a', borderRadius: 8, padding: 16, border: '1px solid #2a2a3a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 600 }}>{c.name}</p>
                <span style={{ color: '#888' }}>{c.count} matches</span>
              </div>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Events: {c.event_names || 'All'}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#888' }}>No custom conversions defined</p>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 16px', background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', fontSize: 14 };
const buttonStyle = { padding: '12px 24px', borderRadius: 8, border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 };

export default Conversions;
