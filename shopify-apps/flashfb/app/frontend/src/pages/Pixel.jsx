import React, { useState, useEffect } from 'react';
import { getPixels, savePixel, testPixel, deletePixel } from '../api/pixel.js';

function Pixel({ storeId }) {
  const [pixels, setPixels] = useState([]);
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testCode, setTestCode] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadPixels();
  }, [storeId]);

  const loadPixels = async () => {
    try {
      const data = await getPixels(storeId);
      setPixels(data.pixels || []);
    } catch (e) {}
  };

  const handleSave = async () => {
    if (!pixelId) return;
    await savePixel(storeId, { pixel_id: pixelId, access_token: accessToken });
    setPixelId('');
    setAccessToken('');
    loadPixels();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testPixel(storeId, { pixel_id: pixelId, access_token: accessToken, test_event_code: testCode });
      setTestResult(result);
    } catch (e) {
      setTestResult({ error: e.message });
    }
    setTesting(false);
  };

  const handleDelete = async (id) => {
    await deletePixel(storeId, id);
    loadPixels();
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Facebook Pixel Setup</h2>
      
      <div style={{ background: '#13131a', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #2a2a3a' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Configure Pixel</h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <input
            type="text"
            placeholder="Facebook Pixel ID"
            value={pixelId}
            onChange={e => setPixelId(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Facebook Access Token (for CAPI)"
            value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Test Event Code (optional)"
            value={testCode}
            onChange={e => setTestCode(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleSave} style={{ ...buttonStyle, background: '#6366f1' }}>Save Pixel</button>
            <button onClick={handleTest} disabled={testing || !pixelId} style={{ ...buttonStyle, background: '#22c55e' }}>
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
        {testResult && (
          <div style={{ marginTop: 16, padding: 16, background: testResult.error ? '#4a1a1a' : '#1a2a1a', borderRadius: 8 }}>
            <p style={{ color: testResult.error ? '#ef4444' : '#22c55e' }}>
              {testResult.error || `Success! Events received: ${testResult.events_received}`}
            </p>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Configured Pixels</h3>
      {pixels.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {pixels.map(p => (
            <div key={p.id} style={{ background: '#13131a', borderRadius: 8, padding: 16, border: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600 }}>Pixel ID: {p.pixel_id}</p>
                <p style={{ fontSize: 12, color: '#888' }}>{p.enabled ? 'Active' : 'Disabled'}</p>
              </div>
              <button onClick={() => handleDelete(p.id)} style={{ ...buttonStyle, background: '#ef4444', padding: '8px 16px' }}>Remove</button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#888' }}>No pixels configured</p>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: '#0a0a0f',
  border: '1px solid #2a2a3a',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14
};

const buttonStyle = {
  padding: '12px 24px',
  borderRadius: 8,
  border: 'none',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 14
};

export default Pixel;
