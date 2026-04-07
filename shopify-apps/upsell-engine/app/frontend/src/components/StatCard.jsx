import React from 'react';

const StatCard = ({ icon, iconClass, value, label, trend, trendDirection }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${iconClass}`}>
          {icon}
        </div>
        <span className={`stat-card-trend ${trendDirection}`}>
          {trendDirection === 'up' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          )}
          {trendDirection === 'down' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          )}
          {trend}
        </span>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
};

export default StatCard;
