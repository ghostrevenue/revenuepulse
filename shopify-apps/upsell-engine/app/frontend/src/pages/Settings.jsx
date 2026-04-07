import React, { useState } from 'react';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    emailReports: true,
    weeklyDigest: true,
    newSales: true,
    lowStock: false,
    tips: true,
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUninstall = () => {
    if (confirm('Are you sure you want to uninstall RevenuePulse? This action cannot be undone.')) {
      console.log('Uninstalling app...');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your RevenuePulse app settings</p>
      </div>

      {/* Store Connection */}
      <div className="settings-card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
          Store Connection
        </h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Store Domain</div>
            <div className="settings-desc">my-shop.myshopify.com</div>
          </div>
          <span className="badge active">Connected</span>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Current Plan</div>
            <div className="settings-desc">Growth Plan — $49/month</div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => console.log('Change plan')}>
            Manage Plan
          </button>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">App Installed</div>
            <div className="settings-desc">March 15, 2024</div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="settings-card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
          Notification Preferences
        </h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Email Reports</div>
            <div className="settings-desc">Receive weekly performance reports via email</div>
          </div>
          <div
            className={`toggle ${notifications.emailReports ? 'active' : ''}`}
            onClick={() => handleToggle('emailReports')}
          >
            <div className="toggle-knob"></div>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Weekly Digest</div>
            <div className="settings-desc">Summary of your upsell performance every Monday</div>
          </div>
          <div
            className={`toggle ${notifications.weeklyDigest ? 'active' : ''}`}
            onClick={() => handleToggle('weeklyDigest')}
          >
            <div className="toggle-knob"></div>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">New Sale Alerts</div>
            <div className="settings-desc">Get notified when you make a new upsell sale</div>
          </div>
          <div
            className={`toggle ${notifications.newSales ? 'active' : ''}`}
            onClick={() => handleToggle('newSales')}
          >
            <div className="toggle-knob"></div>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Low Stock Warnings</div>
            <div className="settings-desc">Alert when upsell products are running low</div>
          </div>
          <div
            className={`toggle ${notifications.lowStock ? 'active' : ''}`}
            onClick={() => handleToggle('lowStock')}
          >
            <div className="toggle-knob"></div>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Tips & Recommendations</div>
            <div className="settings-desc">Occasional tips to improve your upsell performance</div>
          </div>
          <div
            className={`toggle ${notifications.tips ? 'active' : ''}`}
            onClick={() => handleToggle('tips')}
          >
            <div className="toggle-knob"></div>
          </div>
        </div>
      </div>

      {/* App Configuration */}
      <div className="settings-card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
          App Configuration
        </h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Default Currency</div>
            <div className="settings-desc">Currency used for pricing calculations</div>
          </div>
          <select className="form-input" style={{ width: '150px' }} defaultValue="USD">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Timezone</div>
            <div className="settings-desc">For scheduling and reports</div>
          </div>
          <select className="form-input" style={{ width: '200px' }} defaultValue="America/Chicago">
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Upsell Modal Animation</div>
            <div className="settings-desc">Animation style for the customer upsell modal</div>
          </div>
          <select className="form-input" style={{ width: '180px' }} defaultValue="slide-up">
            <option value="slide-up">Slide Up</option>
            <option value="fade-in">Fade In</option>
            <option value="scale">Scale</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-card" style={{ border: '1px solid #DC4545' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7', color: '#DC4545' }}>
          Danger Zone
        </h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Uninstall App</div>
            <div className="settings-desc">Remove RevenuePulse from your store. All data will be deleted.</div>
          </div>
          <button className="btn btn-danger" onClick={handleUninstall}>
            Uninstall App
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
