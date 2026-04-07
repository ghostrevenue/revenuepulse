import React, { useState, useMemo } from 'react';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';

const RevenueIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);

const PercentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);

const TrendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const OfferIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SaleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Dashboard = ({ navigateTo, editOffer }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Mock data
  const stats = {
    totalRevenue: 47892,
    revenueTrend: 12.5,
    upsellRate: 8.4,
    upsellTrend: 2.1,
    aovIncrease: 23.6,
    aovTrend: 5.8,
    activeOffers: 12,
    activeTrend: 0,
  };

  const revenueData = useMemo(() => {
    const days = ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 30', 'Feb 4', 'Feb 9', 'Feb 14', 'Feb 19', 'Feb 24', 'Feb 29', 'Mar 5', 'Mar 10', 'Mar 15', 'Mar 20', 'Mar 25', 'Mar 30', 'Apr 4'];
    return days.map((day, i) => ({
      label: day,
      value: Math.floor(Math.random() * 3000) + 500,
    }));
  }, []);

  const topOffers = [
    { id: 1, name: 'Premium Leather Watch', conversions: 342, revenue: 15390, status: 'active' },
    { id: 2, name: 'Wireless Earbuds Pro', conversions: 289, revenue: 11560, status: 'active' },
    { id: 3, name: 'Smart Home Hub', conversions: 198, revenue: 7920, status: 'active' },
    { id: 4, name: 'Bamboo Desk Set', conversions: 156, revenue: 6240, status: 'active' },
    { id: 5, name: 'Fitness Tracker Band', conversions: 134, revenue: 4690, status: 'draft' },
  ];

  const activities = [
    { id: 1, type: 'sale', title: 'Order #1047 accepted upsell "Premium Leather Watch"', time: '2 minutes ago', icon: 'sale' },
    { id: 2, type: 'offer', title: 'New offer "Summer Collection" created', time: '15 minutes ago', icon: 'offer' },
    { id: 3, type: 'sale', title: 'Order #1046 accepted upsell "Wireless Earbuds Pro"', time: '28 minutes ago', icon: 'sale' },
    { id: 4, type: 'alert', title: 'Offer "Holiday Bundle" paused due to low stock', time: '1 hour ago', icon: 'alert' },
    { id: 5, type: 'sale', title: 'Order #1045 accepted upsell "Smart Home Hub"', time: '2 hours ago', icon: 'sale' },
    { id: 6, type: 'sale', title: 'Order #1044 accepted upsell "Bamboo Desk Set"', time: '3 hours ago', icon: 'sale' },
    { id: 7, type: 'offer', title: 'Offer "Flash Sale" archived', time: '5 hours ago', icon: 'offer' },
  ];

  const handleActionClick = (e, offerId) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === offerId ? null : offerId);
  };

  const handleEdit = (offer) => {
    setActiveDropdown(null);
    editOffer(offer.id);
  };

  const handleDuplicate = (offer) => {
    setActiveDropdown(null);
    console.log('Duplicate offer:', offer.id);
  };

  const handleArchive = (offer) => {
    setActiveDropdown(null);
    console.log('Archive offer:', offer.id);
  };

  const handleDelete = (offer) => {
    setActiveDropdown(null);
    console.log('Delete offer:', offer.id);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's how your upsell engine is performing.</p>
      </div>

      <div className="card-grid">
        <StatCard
          icon={<RevenueIcon />}
          iconClass="purple"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          label="Total Revenue"
          trend={`+${stats.revenueTrend}%`}
          trendDirection="up"
        />
        <StatCard
          icon={<PercentIcon />}
          iconClass="green"
          value={`${stats.upsellRate}%`}
          label="Upsell Rate"
          trend={`+${stats.upsellTrend}%`}
          trendDirection="up"
        />
        <StatCard
          icon={<TrendIcon />}
          iconClass="orange"
          value={`+${stats.aovIncrease}%`}
          label="AOV Increase"
          trend={`+${stats.aovTrend}%`}
          trendDirection="up"
        />
        <StatCard
          icon={<OfferIcon />}
          iconClass="blue"
          value={stats.activeOffers}
          label="Active Offers"
          trend="No change"
          trendDirection="neutral"
        />
      </div>

      <div className="two-col-grid">
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-title">Revenue (Last 30 Days)</div>
            <div className="chart-legend">
              <div className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: '#5C6AC4' }}></div>
                Daily Revenue
              </div>
            </div>
          </div>
          <BarChart data={revenueData} />
        </div>

        <div className="table-container">
          <div className="table-header">
            <div className="table-title">Top Offers</div>
            <button className="btn btn-sm btn-secondary" onClick={() => navigateTo('offers')}>
              View All
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Offer</th>
                <th>Conversions</th>
                <th>Revenue</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {topOffers.map(offer => (
                <tr key={offer.id} onClick={() => handleEdit(offer)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${offer.status}`}>{offer.status}</span>
                      {offer.name}
                    </div>
                  </td>
                  <td>{offer.conversions.toLocaleString()}</td>
                  <td>${offer.revenue.toLocaleString()}</td>
                  <td>
                    <div className="action-menu">
                      <button
                        className="btn-icon"
                        onClick={(e) => handleActionClick(e, offer.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>
                      {activeDropdown === offer.id && (
                        <div className="action-dropdown">
                          <button className="action-dropdown-item" onClick={() => handleEdit(offer)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button className="action-dropdown-item" onClick={() => handleDuplicate(offer)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                            </svg>
                            Duplicate
                          </button>
                          <button className="action-dropdown-item" onClick={() => handleArchive(offer)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="21 8 21 21 3 21 3 8"/>
                              <rect x="1" y="3" width="22" height="5"/>
                              <line x1="10" y1="12" x2="14" y2="12"/>
                            </svg>
                            Archive
                          </button>
                          <button className="action-dropdown-item danger" onClick={() => handleDelete(offer)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: '24px' }}>
        <div className="table-header">
          <div className="table-title">Recent Activity</div>
        </div>
        <div className="activity-feed">
          {activities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className={`activity-icon ${activity.icon}`}>
                {activity.icon === 'sale' && <CheckIcon />}
                {activity.icon === 'offer' && <OfferIcon />}
                {activity.icon === 'alert' && <SaleIcon />}
              </div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
