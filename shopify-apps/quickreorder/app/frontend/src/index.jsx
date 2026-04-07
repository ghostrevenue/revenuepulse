const { createRoot } = ReactDOM;

function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [storeId] = React.useState(1);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard storeId={storeId} />;
      case 'subscriptions': return <Subscriptions storeId={storeId} />;
      case 'plans': return <Plans storeId={storeId} />;
      case 'orders': return <Orders storeId={storeId} />;
      case 'analytics': return <Analytics storeId={storeId} />;
      case 'billing': return <Billing storeId={storeId} />;
      default: return <Dashboard storeId={storeId} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

function Sidebar({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '🔄' },
    { id: 'plans', label: 'Plans', icon: '📋' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1><span className="icon">⚡</span> QuickReorder</h1>
        <span>Subscription Management</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          {navItems.slice(0, 4).map(item => (
            <div 
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        <div className="nav-section">
          <div className="nav-section-title">Settings</div>
          {navItems.slice(4).map(item => (
            <div 
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function Dashboard({ storeId }) {
  const [metrics, setMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/analytics/dashboard/${storeId}`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data.metrics);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeId]);

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your subscription business</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="label">Monthly Recurring Revenue</div>
          <div className="value positive">${(metrics?.totalRevenue || 0).toLocaleString()}</div>
          <div className="change up">↑ 12% from last month</div>
        </div>
        <div className="metric-card">
          <div className="label">Active Subscribers</div>
          <div className="value neutral">{metrics?.activeSubscribers || 0}</div>
          <div className="change up">↑ {metrics?.newSubscribersToday || 0} today</div>
        </div>
        <div className="metric-card">
          <div className="label">Monthly Churn Rate</div>
          <div className="value negative">{metrics?.churnRate || 0}%</div>
          <div className="change down">↓ 2% improvement</div>
        </div>
        <div className="metric-card">
          <div className="label">Pending Orders</div>
          <div className="value neutral">{metrics?.pendingOrders || 0}</div>
          <div className="change">Awaiting processing</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Subscriptions</h3>
          </div>
          <RecentSubscriptions storeId={storeId} />
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">MRR Trend</h3>
          </div>
          <div className="chart-placeholder">
            Chart visualization coming soon
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentSubscriptions({ storeId }) {
  const [subscriptions, setSubscriptions] = React.useState([]);

  React.useEffect(() => {
    fetch(`/api/subscriptions/store/${storeId}/active`)
      .then(res => res.json())
      .then(data => setSubscriptions(data.subscriptions?.slice(0, 5) || []))
      .catch(() => {});
  }, [storeId]);

  if (subscriptions.length === 0) {
    return <div className="empty-state"><p>No active subscriptions yet</p></div>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Product</th>
          <th>Status</th>
          <th>Next Billing</th>
        </tr>
      </thead>
      <tbody>
        {subscriptions.map(sub => (
          <tr key={sub.id}>
            <td>{sub.customer_id}</td>
            <td>{sub.product_id}</td>
            <td><span className={`badge ${sub.status}`}>{sub.status}</span></td>
            <td>{new Date(sub.next_billing_date).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Subscriptions({ storeId }) {
  const [subscriptions, setSubscriptions] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/subscriptions/store/${storeId}`)
      .then(res => res.json())
      .then(data => {
        setSubscriptions(data.subscriptions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeId]);

  const filteredSubs = filter === 'all' 
    ? subscriptions 
    : subscriptions.filter(s => s.status === filter);

  const handlePause = (id) => {
    fetch(`/api/subscriptions/${id}/pause`, { method: 'POST' })
      .then(() => window.location.reload())
      .catch(() => {});
  };

  const handleResume = (id) => {
    fetch(`/api/subscriptions/${id}/resume`, { method: 'POST' })
      .then(() => window.location.reload())
      .catch(() => {});
  };

  const handleCancel = (id) => {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      fetch(`/api/subscriptions/${id}/cancel`, { method: 'POST' })
        .then(() => window.location.reload())
        .catch(() => {});
    }
  };

  const handleSkip = (id) => {
    fetch(`/api/subscriptions/${id}/skip`, { method: 'POST' })
      .then(() => window.location.reload())
      .catch(() => {});
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Subscriptions</h2>
        <p>Manage all customer subscriptions</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs">
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Active</button>
            <button className={`tab ${filter === 'paused' ? 'active' : ''}`} onClick={() => setFilter('paused')}>Paused</button>
            <button className={`tab ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => setFilter('cancelled')}>Cancelled</button>
          </div>
        </div>

        {filteredSubs.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No subscriptions found</h3>
            <p>Subscriptions will appear here once customers subscribe to your plans</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Frequency</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Next Billing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map(sub => (
                <tr key={sub.id}>
                  <td>#{sub.id}</td>
                  <td>{sub.customer_id}</td>
                  <td>{sub.product_id}</td>
                  <td>{sub.frequency_days} days</td>
                  <td>{sub.discount_percent}%</td>
                  <td><span className={`badge ${sub.status}`}>{sub.status}</span></td>
                  <td>{sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {sub.status === 'active' && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => handlePause(sub.id)}>Pause</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleSkip(sub.id)}>Skip</button>
                        </>
                      )}
                      {sub.status === 'paused' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleResume(sub.id)}>Resume</button>
                      )}
                      {sub.status !== 'cancelled' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(sub.id)}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Plans({ storeId }) {
  const [plans, setPlans] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    frequency_days: 30,
    discount_percent: 10
  });

  React.useEffect(() => {
    fetch(`/api/plans/store/${storeId}`)
      .then(res => res.json())
      .then(data => {
        setPlans(data.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, store_id: storeId })
    })
      .then(res => res.json())
      .then(() => window.location.reload())
      .catch(() => {});
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to deactivate this plan?')) {
      fetch(`/api/plans/${id}`, { method: 'DELETE' })
        .then(() => window.location.reload())
        .catch(() => {});
    }
  };

  const frequencyLabels = { 7: 'Weekly', 14: 'Biweekly', 30: 'Monthly', 60: 'Every 2 Months', 90: 'Quarterly' };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Subscription Plans</h2>
        <p>Create and manage subscription plans with frequencies and discounts</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Plans</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Plan'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px', padding: '20px', background: '#0f0f12', borderRadius: '8px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select 
                  className="form-input form-select"
                  value={formData.frequency_days}
                  onChange={e => setFormData({...formData, frequency_days: parseInt(e.target.value)})}
                >
                  <option value="7">Weekly (7 days)</option>
                  <option value="14">Biweekly (14 days)</option>
                  <option value="30">Monthly (30 days)</option>
                  <option value="60">Every 2 Months (60 days)</option>
                  <option value="90">Quarterly (90 days)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Discount % (5-30)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.discount_percent}
                  onChange={e => setFormData({...formData, discount_percent: parseFloat(e.target.value)})}
                  min="5" 
                  max="30" 
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Create Plan</button>
          </form>
        )}

        {plans.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No plans yet</h3>
            <p>Create your first subscription plan to start accepting subscriptions</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Frequency</th>
                <th>Discount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td><strong>{plan.name}</strong></td>
                  <td>{plan.description || '-'}</td>
                  <td>{frequencyLabels[plan.frequency_days] || `${plan.frequency_days} days`}</td>
                  <td><span className="badge active">{plan.discount_percent}% off</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(plan.id)}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Orders({ storeId }) {
  const [orders, setOrders] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/orders/store/${storeId}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeId]);

  const handleRetry = (id) => {
    fetch(`/api/orders/${id}/retry`, { method: 'POST' })
      .then(() => window.location.reload())
      .catch(() => {});
  };

  const handleStatusChange = (id, status) => {
    fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(() => window.location.reload())
      .catch(() => {});
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
        <p>Track subscription orders and manage fulfillment</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tabs">
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
            <button className={`tab ${filter === 'charged' ? 'active' : ''}`} onClick={() => setFilter('charged')}>Charged</button>
            <button className={`tab ${filter === 'shipped' ? 'active' : ''}`} onClick={() => setFilter('shipped')}>Shipped</button>
            <button className={`tab ${filter === 'failed' ? 'active' : ''}`} onClick={() => setFilter('failed')}>Failed</button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No orders found</h3>
            <p>Subscription orders will appear here when billing cycles occur</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Subscription</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_id || `#${order.id}`}</td>
                  <td>#{order.subscription_id}</td>
                  <td>${order.amount?.toFixed(2) || '0.00'}</td>
                  <td><span className={`badge ${order.status}`}>{order.status}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    {order.status === 'failed' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleRetry(order.id)}>Retry</button>
                    )}
                    {order.status === 'pending' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(order.id, 'charged')}>Mark Charged</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Analytics({ storeId }) {
  const [mrr, setMrr] = React.useState(null);
  const [ltv, setLtv] = React.useState(null);
  const [funnel, setFunnel] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch(`/api/analytics/mrr/${storeId}`).then(res => res.json()),
      fetch(`/api/analytics/ltv/${storeId}`).then(res => res.json()),
      fetch(`/api/analytics/churn-funnel/${storeId}`).then(res => res.json())
    ]).then(([mrrData, ltvData, funnelData]) => {
      setMrr(mrrData.mrr);
      setLtv(ltvData.ltv);
      setFunnel(funnelData.funnel);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [storeId]);

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Deep dive into your subscription metrics</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="label">Monthly Recurring Revenue</div>
          <div className="value positive">${(mrr?.current || 0).toLocaleString()}</div>
          <div className="change">Average: ${(mrr?.average || 0).toLocaleString()}/mo</div>
        </div>
        <div className="metric-card">
          <div className="label">Customer Lifetime Value</div>
          <div className="value neutral">${(ltv?.ltv || 0).toLocaleString()}</div>
          <div className="change">Avg age: {ltv?.averageAgeDays || 0} days</div>
        </div>
        <div className="metric-card">
          <div className="label">Churn Rate</div>
          <div className="value negative">{funnel?.churned || 0}%</div>
          <div className="change">{funnel?.conversionRate || 0}% retention</div>
        </div>
        <div className="metric-card">
          <div className="label">Avg Revenue/Subscriber</div>
          <div className="value positive">${(ltv?.averageRevenuePerSubscriber || 0).toLocaleString()}</div>
          <div className="change">Lifetime: {ltv?.lifetimeMonths || 0} months</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Churn Funnel</h3>
          </div>
          {funnel && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{funnel.active}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>Active</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{funnel.paused}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>Paused</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{funnel.churned}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>Churned</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{funnel.atRisk}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>At Risk</div>
                </div>
              </div>
              <div style={{ height: '8px', background: '#252530', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(funnel.active / funnel.total) * 100}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  display: 'inline-block'
                }}></div>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">MRR Trend</h3>
          </div>
          <div className="chart-placeholder">
            {mrr?.monthly?.length > 0 
              ? mrr.monthly.map(m => (
                  <div key={m.month} style={{ padding: '8px', background: '#252530', margin: '4px', borderRadius: '4px' }}>
                    {m.month}: ${m.revenue.toLocaleString()}
                  </div>
                ))
              : 'No data available'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function Billing({ storeId }) {
  const [pricing, setPricing] = React.useState(null);
  const [currentPlan, setCurrentPlan] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/billing/pricing').then(res => res.json()),
      fetch(`/api/billing/store/${storeId}`).then(res => res.json())
    ]).then(([pricingData, billingData]) => {
      setPricing(pricingData.pricing);
      setCurrentPlan(billingData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [storeId]);

  const handleUpgrade = (planType) => {
    if (confirm(`Upgrade to ${planType} plan?`)) {
      fetch(`/api/billing/store/${storeId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType })
      })
        .then(() => window.location.reload())
        .catch(() => {});
    }
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Billing</h2>
        <p>Manage your subscription plan and billing</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Current Plan</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '20px', background: '#0f0f12', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', textTransform: 'capitalize' }}>{currentPlan?.planType || 'Starter'}</div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>${pricing?.[currentPlan?.planType]?.price || 19}/month</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
              {currentPlan?.limits?.subscribers || 50} subscribers • {currentPlan?.limits?.plans || 1} plans
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Features: {currentPlan?.features?.join(', ') || 'Basic analytics'}
            </div>
          </div>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: '32px' }}>
        <h3>Available Plans</h3>
      </div>

      <div className="pricing-grid">
        {pricing && Object.entries(pricing).map(([key, plan]) => (
          <div key={key} className={`pricing-card ${currentPlan?.planType === key ? 'featured' : ''}`}>
            <div className="name">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
            <div className="price">${plan.price}<span>/month</span></div>
            <ul className="features">
              <li>{plan.subscribers === Infinity ? 'Unlimited' : plan.subscribers} subscribers</li>
              <li>{plan.plans === Infinity ? 'Unlimited' : plan.plans} plans</li>
              {plan.features.map(f => (
                <li key={f}>{f.replace(/_/g, ' ')}</li>
              ))}
            </ul>
            {currentPlan?.planType === key ? (
              <button className="btn btn-secondary" disabled>Current Plan</button>
            ) : (
              <button className="btn btn-primary" onClick={() => handleUpgrade(key)}>
                {pricing[currentPlan?.planType]?.price < plan.price ? 'Upgrade' : 'Downgrade'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
