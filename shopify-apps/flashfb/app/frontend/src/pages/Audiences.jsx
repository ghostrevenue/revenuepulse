import React, { useState, useEffect } from 'react';

function Audiences({ storeId }) {
  const [audiences, setAudiences] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('custom_audience');
  const [rules, setRules] = useState('');

  useEffect(() => {
    fetch(`/api/audiences/${storeId}`)
      .then(r => r.json())
      .then(data => setAudiences(data.audiences || []))
      .catch(() => {});
  }, [storeId]);

  const handleCreate = async () => {
    if (!name) return;
    await fetch(`/api/audiences/${storeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, audience_type: type, rules })
    });
    setName('');
    setRules('');
    const res = await fetch(`/api/audiences/${storeId}`);
    const data = await res.json();
    setAudiences(data.audiences || []);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Custom Audiences</h2>
      
      <div style={{ background: '#13131a', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #2a2a3a' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create Audience</h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <input type="text" placeholder="Audience Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle }}>
            <option value="custom_audience">Custom Audience</option>
            <option value="lookalike">Lookalike Audience</option>
          </select>
          <textarea placeholder="Rules (JSON)" value={rules} onChange={e => setRules(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} />
          <button onClick={handleCreate} style={{ ...buttonStyle, background: '#6366f1', alignSelf: 'flex-start' }}>Create Audience</button>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Audiences</h3>
      {audiences.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {audiences.map(a => (
            <div key={a.id} style={{ background: '#13131a', borderRadius: 8, padding: 16, border: '1px solid #2a2a3a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 600 }}>{a.name}</p>
                <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: a.status === 'synced' ? '#22c55e' : '#f59e0b', color: '#fff' }}>{a.status}</span>
              </div>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Type: {a.audience_type} | Size: {a.size || 0}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#888' }}>No audiences created yet</p>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 16px', background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', fontSize: 14 };
const buttonStyle = { padding: '12px 24px', borderRadius: 8, border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 };

export default Audiences;
