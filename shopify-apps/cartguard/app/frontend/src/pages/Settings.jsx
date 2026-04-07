// Settings Page
import React, { useState } from 'react';

export default function Settings({ store }) {
  const [settings, setSettings] = useState({
    exit_intent_delay: 5000,
    session_frequency: 'once',
    offer_threshold: 50,
    modal_style: 'slide'
  });

  const handleSave = () => {
    alert('Settings saved!');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="card">
        <div className="settings-section">
          <h3>Exit Intent Detection</h3>
          <div className="form-group">
            <label className="form-label">Delay (ms)</label>
            <input type="number" className="form-input" value={settings.exit_intent_delay}
              onChange={e => setSettings({ ...settings, exit_intent_delay: parseInt(e.target.value) })} />
            <small style={{ color: 'var(--text-muted)' }}>Wait before showing exit intent modal</small>
          </div>
          <div className="form-group">
            <label className="form-label">Session Frequency</label>
            <select className="form-input" value={settings.session_frequency}
              onChange={e => setSettings({ ...settings, session_frequency: e.target.value })}>
              <option value="once">Once per session</option>
              <option value="once_per_hour">Once per hour</option>
              <option value="always">Every time</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Offer Triggers</h3>
          <div className="form-group">
            <label className="form-label">Minimum Cart Value ($)</label>
            <input type="number" className="form-input" value={settings.offer_threshold}
              onChange={e => setSettings({ ...settings, offer_threshold: parseFloat(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Modal Style</label>
            <select className="form-input" value={settings.modal_style}
              onChange={e => setSettings({ ...settings, modal_style: e.target.value })}>
              <option value="slide">Slide In</option>
              <option value="fade">Fade</option>
              <option value="pop">Pop</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  );
}
