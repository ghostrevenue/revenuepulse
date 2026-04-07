import React, { useState } from 'react';

const OffersList = ({ navigateTo, editOffer }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const tabs = [
    { id: 'all', label: 'All', count: 24 },
    { id: 'active', label: 'Active', count: 12 },
    { id: 'draft', label: 'Draft', count: 8 },
    { id: 'archived', label: 'Archived', count: 4 },
  ];

  const [offers, setOffers] = useState([
    { id: 1, name: 'Premium Leather Watch', status: 'active', trigger: 'Order ≥ $100', product: 'Premium Leather Watch', conversions: 342, revenue: 15390 },
    { id: 2, name: 'Wireless Earbuds Pro', status: 'active', trigger: 'Order ≥ $75', product: 'Wireless Earbuds Pro', conversions: 289, revenue: 11560 },
    { id: 3, name: 'Smart Home Hub', status: 'active', trigger: 'Order ≥ $150', product: 'Smart Home Hub', conversions: 198, revenue: 7920 },
    { id: 4, name: 'Bamboo Desk Set', status: 'active', trigger: 'Order ≥ $50', product: 'Bamboo Desk Set', conversions: 156, revenue: 6240 },
    { id: 5, name: 'Fitness Tracker Band', status: 'draft', trigger: 'Any order', product: 'Fitness Tracker Band', conversions: 0, revenue: 0 },
    { id: 6, name: 'Portable Charger', status: 'active', trigger: 'Order ≥ $60', product: 'Portable Charger', conversions: 134, revenue: 4690 },
    { id: 7, name: 'Bluetooth Speaker', status: 'active', trigger: 'Order ≥ $80', product: 'Bluetooth Speaker', conversions: 112, revenue: 3920 },
    { id: 8, name: 'Laptop Stand', status: 'draft', trigger: 'Order ≥ $100', product: 'Laptop Stand', conversions: 0, revenue: 0 },
    { id: 9, name: 'USB-C Hub', status: 'archived', trigger: 'Order ≥ $90', product: 'USB-C Hub', conversions: 89, revenue: 2670 },
    { id: 10, name: 'Webcam HD', status: 'active', trigger: 'Order ≥ $120', product: 'Webcam HD', conversions: 78, revenue: 3120 },
    { id: 11, name: 'Keyboard Pro', status: 'draft', trigger: 'Order ≥ $100', product: 'Keyboard Pro', conversions: 0, revenue: 0 },
    { id: 12, name: 'Mouse Wireless', status: 'active', trigger: 'Order ≥ $70', product: 'Mouse Wireless', conversions: 145, revenue: 5075 },
  ]);

  const filteredOffers = activeTab === 'all'
    ? offers
    : offers.filter(o => o.status === activeTab);

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">Manage your upsell offers and campaigns</p>
        </div>
        <button className="btn btn-success" onClick={() => navigateTo('offer-builder-new')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New Offer
        </button>
      </div>

      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E4E7' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`date-range-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ background: activeTab === tab.id ? '#5C6AC4' : 'white', color: activeTab === tab.id ? 'white' : '#202223' }}
              >
                {tab.label}
                <span style={{ marginLeft: '6px', opacity: 0.7 }}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Trigger</th>
              <th>Product</th>
              <th>Conversions</th>
              <th>Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredOffers.map(offer => (
              <tr key={offer.id} onClick={() => handleEdit(offer)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 500 }}>{offer.name}</td>
                <td>
                  <span className={`badge ${offer.status}`}>
                    {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                  </span>
                </td>
                <td style={{ color: '#6D7175' }}>{offer.trigger}</td>
                <td>{offer.product}</td>
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
  );
};

export default OffersList;
