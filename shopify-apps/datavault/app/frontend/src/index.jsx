// DataVault - Customer Analytics Platform
const { useState, useEffect, useCallback } = React;

// API Helper
const api = {
  async get(path) {
    const shop = new URLSearchParams(window.location.search).get('shop') || 'demo-store';
    const res = await fetch(`/api${path}?shop=${shop}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async post(path, data) {
    const shop = new URLSearchParams(window.location.search).get('shop') || 'demo-store';
    const res = await fetch(`/api${path}?shop=${shop}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

// Nav Items
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'segments', label: 'Segments', icon: '🎯' },
  { id: 'cohorts', label: 'Cohorts', icon: '📈' },
  { id: 'analytics', label: 'Analytics', icon: '📉' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'billing', label: 'Billing', icon: '💳' }
];

// Dashboard Component
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customers/stats').then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="header">
        <h2>Dashboard</h2>
        <p>Overview of your store's customer analytics</p>
      </div>
      
      <div className="stats-grid">
        <div className="card">
          <div className="card-title">Total Customers</div>
          <div className="card-value">{stats?.total?.toLocaleString() || 0}</div>
          <div className="card-sub">{stats?.newToday || 0} new today</div>
        </div>
        <div className="card">
          <div className="card-title">Average LTV</div>
          <div className="card-value">${(stats?.avgLtv || 0).toFixed(2)}</div>
          <div className="card-sub">Lifetime value</div>
        </div>
        <div className="card">
          <div className="card-title">Total Revenue</div>
          <div className="card-value">${(stats?.totalRevenue || 0).toLocaleString()}</div>
          <div className="card-sub">From all customers</div>
        </div>
        <div className="card">
          <div className="card-title">At Risk</div>
          <div className="card-value" style={{ color: '#ef4444' }}>{stats?.atRisk || 0}</div>
          <div className="card-sub">High churn score</div>
        </div>
      </div>
    </div>
  );
}

// Customers Component
function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadCustomers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ search, limit: 50 });
    api.get(`/customers?${params}`).then(data => setCustomers(data.customers || [])).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  return (
    <div>
      <div className="header">
        <h2>Customers</h2>
        <p>View and manage your customer profiles</p>
      </div>
      
      <div className="search-bar">
        <input className="search-input" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      
      {loading ? <div className="loading">Loading customers...</div> : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Avg Order</th>
                  <th>Churn Risk</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} onClick={() => setSelectedCustomer(c)} style={{ cursor: 'pointer' }}>
                    <td>{c.email}</td>
                    <td>{c.first_name} {c.last_name}</td>
                    <td>{c.total_orders}</td>
                    <td>${c.total_spent.toFixed(2)}</td>
                    <td>${c.avg_order_value.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${c.churn_score > 70 ? 'red' : c.churn_score > 40 ? 'yellow' : 'green'}`}>
                        {c.churn_score.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedCustomer && <CustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
    </div>
  );
}

function CustomerModal({ customer, onClose }) {
  const [behavior, setBehavior] = useState(null);
  
  useEffect(() => {
    api.get(`/customers/${customer.id}`).then(data => setBehavior(data.behavior)).catch(console.error);
  }, [customer.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Customer Profile</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="grid-2">
          <div>
            <h3 style={{ marginBottom: 12 }}>Contact</h3>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Name:</strong> {customer.first_name} {customer.last_name}</p>
            <p><strong>Since:</strong> {new Date(customer.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 style={{ marginBottom: 12 }}>Metrics</h3>
            <p><strong>Orders:</strong> {customer.total_orders}</p>
            <p><strong>Total Spent:</strong> ${customer.total_spent.toFixed(2)}</p>
            <p><strong>Avg Order:</strong> ${customer.avg_order_value.toFixed(2)}</p>
          </div>
        </div>
        
        {behavior && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Behavior Summary</h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="card">
                <div className="card-title">Purchases</div>
                <div className="card-value">{behavior.purchases}</div>
              </div>
              <div className="card">
                <div className="card-title">Abandons</div>
                <div className="card-value">{behavior.abandons}</div>
              </div>
              <div className="card">
                <div className="card-title">Browses</div>
                <div className="card-value">{behavior.browses}</div>
              </div>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: 20 }}>
          <span className={`badge ${customer.churn_score > 70 ? 'red' : customer.churn_score > 40 ? 'yellow' : 'green'}`}>
            Churn Risk: {customer.churn_score.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Segments Component
function Segments() {
  const [segments, setSegments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSegments = () => {
    setLoading(true);
    api.get('/segments').then(data => setSegments(data.segments || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadSegments(); }, []);

  const handleDelete = async (id) => {
    if (confirm('Delete this segment?')) {
      await api.post(`/segments/${id}/delete`, {});
      loadSegments();
    }
  };

  return (
    <div>
      <div className="header">
        <h2>Segments</h2>
        <p>Create and manage customer segments</p>
      </div>
      
      <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginBottom: 20 }}>
        + Create Segment
      </button>
      
      {loading ? <div className="loading">Loading segments...</div> : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Rules</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {segments.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.description || '-'}</td>
                    <td>{JSON.parse(s.rules || '[]').length} rules</td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {segments.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: '#71717a' }}>No segments yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showModal && <SegmentModal onClose={() => setShowModal(false)} onSave={loadSegments} />}
    </div>
  );
}

function SegmentModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState([{ field: 'total_spent', operator: 'gt', value: 100 }]);
  const [previewCount, setPreviewCount] = useState(null);

  const fields = [
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'total_orders', label: 'Total Orders' },
    { value: 'avg_order_value', label: 'Avg Order Value' },
    { value: 'churn_score', label: 'Churn Score' },
    { value: 'last_order_date', label: 'Days Since Last Order' }
  ];
  const operators = [
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' }
  ];

  const addRule = () => setRules([...rules, { field: 'total_spent', operator: 'gt', value: 100 }]);
  const updateRule = (i, key, val) => {
    const newRules = [...rules];
    newRules[i][key] = val;
    setRules(newRules);
  };
  const removeRule = (i) => setRules(rules.filter((_, idx) => idx !== i));

  const preview = async () => {
    const data = await api.post('/segments/preview', { rules });
    setPreviewCount(data.count);
  };

  const handleSave = async () => {
    await api.post('/segments', { name, description, rules });
    onSave();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create Segment</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="form-group">
          <label className="form-label">Segment Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., High Value Customers" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Rules (all must match)</label>
          <div className="rule-builder">
            {rules.map((rule, i) => (
              <div key={i} className="rule-row">
                <select value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)}>
                  {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select value={rule.operator} onChange={e => updateRule(i, 'operator', e.target.value)}>
                  {operators.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input type="number" value={rule.value} onChange={e => updateRule(i, 'value', parseFloat(e.target.value))} />
                {rules.length > 1 && <button className="btn btn-secondary" onClick={() => removeRule(i)}>×</button>}
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addRule}>+ Add Rule</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <button className="btn btn-secondary" onClick={preview}>Preview Count</button>
          {previewCount !== null && <span>{previewCount} customers match</span>}
        </div>
        
        <button className="btn btn-primary" onClick={handleSave} disabled={!name}>Save Segment</button>
      </div>
    </div>
  );
}

// Cohorts Component
function Cohorts() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cohorts/report').then(data => setReport(data.report || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading cohort analysis...</div>;

  return (
    <div>
      <div className="header">
        <h2>Cohort Analysis</h2>
        <p>Customer retention by acquisition month</p>
      </div>
      
      <div className="card">
        <div className="cohort-table">
          <table>
            <thead>
              <tr>
                <th>Cohort</th>
                <th>Size</th>
                <th>Month 0</th>
                <th>Month 1</th>
                <th>Month 2</th>
                <th>Month 3</th>
                <th>Month 4</th>
                <th>Month 5</th>
                <th>Month 6</th>
              </tr>
            </thead>
            <tbody>
              {report.map((row, i) => (
                <tr key={i}>
                  <td>{row.cohort}</td>
                  <td>{row.size}</td>
                  {row.retention.map((r, j) => (
                    <td key={j} className={`cohort-cell ${r.percentage > 60 ? 'high' : r.percentage > 30 ? 'medium' : 'low'}`}>
                      {r.percentage}%
                    </td>
                  ))}
                </tr>
              ))}
              {report.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', color: '#71717a' }}>No cohort data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Analytics Component
function Analytics() {
  const [rfm, setRfm] = useState(null);
  const [churn, setChurn] = useState(null);
  const [ltv, setLtv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('rfm');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/rfm'),
      api.get('/analytics/churn'),
      api.get('/analytics/ltv/distribution')
    ]).then(([rfmData, churnData, ltvData]) => {
      setRfm(rfmData);
      setChurn(churnData);
      setLtv(ltvData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div>
      <div className="header">
        <h2>Analytics</h2>
        <p>RFM analysis, churn scoring, and LTV distribution</p>
      </div>
      
      <div className="tabs">
        <div className={`tab ${tab === 'rfm' ? 'active' : ''}`} onClick={() => setTab('rfm')}>RFM Analysis</div>
        <div className={`tab ${tab === 'churn' ? 'active' : ''}`} onClick={() => setTab('churn')}>Churn Risk</div>
        <div className={`tab ${tab === 'ltv' ? 'active' : ''}`} onClick={() => setTab('ltv')}>LTV Distribution</div>
      </div>
      
      {tab === 'rfm' && rfm && (
        <div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-title">Champions</div>
              <div className="card-value" style={{ color: '#22c55e' }}>{rfm.segments.champions}</div>
              <div className="card-sub">Best customers (R≥4, F≥4, M≥4)</div>
            </div>
            <div className="card">
              <div className="card-title">Loyal</div>
              <div className="card-value" style={{ color: '#6366f1' }}>{rfm.segments.loyal}</div>
              <div className="card-sub">Frequent buyers (F≥3, M≥3)</div>
            </div>
            <div className="card">
              <div className="card-title">Potential</div>
              <div className="card-value" style={{ color: '#eab308' }}>{rfm.segments.potential}</div>
              <div className="card-sub">Recent but infrequent (R≥3, F≤2)</div>
            </div>
            <div className="card">
              <div className="card-title">At Risk</div>
              <div className="card-value" style={{ color: '#ef4444' }}>{rfm.segments.atRisk}</div>
              <div className="card-sub">Need re-engagement (R≤2)</div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>RFM Distribution</h3>
            <p style={{ color: '#71717a', marginBottom: 12 }}>Total customers: {rfm.total}</p>
            <div className="grid-3">
              <div>
                <h4 style={{ color: '#a1a1aa', marginBottom: 8 }}>Recency (R)</h4>
                {[5,4,3,2,1].map(r => <div key={r} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>R{r}: {rfm.distribution.r[r] || 0}</span>
                  <span style={{ color: '#71717a' }}>{rfm.total > 0 ? Math.round((rfm.distribution.r[r] || 0) / rfm.total * 100) : 0}%</span>
                </div>)}
              </div>
              <div>
                <h4 style={{ color: '#a1a1aa', marginBottom: 8 }}>Frequency (F)</h4>
                {[5,4,3,2,1].map(f => <div key={f} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>F{f}: {rfm.distribution.f[f] || 0}</span>
                  <span style={{ color: '#71717a' }}>{rfm.total > 0 ? Math.round((rfm.distribution.f[f] || 0) / rfm.total * 100) : 0}%</span>
                </div>)}
              </div>
              <div>
                <h4 style={{ color: '#a1a1aa', marginBottom: 8 }}>Monetary (M)</h4>
                {[5,4,3,2,1].map(m => <div key={m} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>M{m}: {rfm.distribution.m[m] || 0}</span>
                  <span style={{ color: '#71717a' }}>{rfm.total > 0 ? Math.round((rfm.distribution.m[m] || 0) / rfm.total * 100) : 0}%</span>
                </div>)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {tab === 'churn' && churn && (
        <div>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-title">High Risk</div>
              <div className="card-value" style={{ color: '#ef4444' }}>{churn.high.count}</div>
              <div className="progress-bar"><div className="progress-fill red" style={{ width: `${churn.high.percentage}%` }}></div></div>
              <div className="card-sub">{churn.high.percentage}%</div>
            </div>
            <div className="card">
              <div className="card-title">Medium Risk</div>
              <div className="card-value" style={{ color: '#eab308' }}>{churn.medium.count}</div>
              <div className="progress-bar"><div className="progress-fill yellow" style={{ width: `${churn.medium.percentage}%` }}></div></div>
              <div className="card-sub">{churn.medium.percentage}%</div>
            </div>
            <div className="card">
              <div className="card-title">Low Risk</div>
              <div className="card-value" style={{ color: '#22c55e' }}>{churn.low.count}</div>
              <div className="progress-bar"><div className="progress-fill green" style={{ width: `${churn.low.percentage}%` }}></div></div>
              <div className="card-sub">{churn.low.percentage}%</div>
            </div>
          </div>
        </div>
      )}
      
      {tab === 'ltv' && ltv && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>LTV Distribution</h3>
          {ltv.distribution.map((bucket, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{bucket.label}</span>
                <span>{bucket.count} customers</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill green" style={{ width: `${ltv.distribution.reduce((a, b) => a + b.count, 0) > 0 ? bucket.count / ltv.distribution.reduce((a, b) => a + b.count, 0) * 100 : 0}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Reports Component
function Reports() {
  const [metrics, setMetrics] = useState(['total_orders', 'total_spent']);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const availableMetrics = [
    { value: 'total_orders', label: 'Total Orders' },
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'avg_order_value', label: 'Avg Order Value' },
    { value: 'customer_count', label: 'Customer Count' },
    { value: 'new_customers', label: 'New Customers' }
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = await api.post('/reports/generate', { metrics });
      setResult(data.report);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMetric = (m) => {
    if (metrics.includes(m)) setMetrics(metrics.filter(x => x !== m));
    else setMetrics([...metrics, m]);
  };

  return (
    <div>
      <div className="header">
        <h2>Reports</h2>
        <p>Build custom reports on customer behavior</p>
      </div>
      
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Select Metrics</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {availableMetrics.map(m => (
            <span 
              key={m.value} 
              className={`badge ${metrics.includes(m.value) ? 'blue' : ''}`}
              style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '14px' }}
              onClick={() => toggleMetric(m.value)}
            >
              {m.label}
            </span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={generateReport} disabled={loading || metrics.length === 0}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
      
      {result && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Report Results</h3>
          <div className="table-container">
            <table>
              <thead><tr>{metrics.map(m => <th key={m}>{m.replace('_', ' ')}</th>)}</tr></thead>
              <tbody><tr>{metrics.map(m => <td key={m}>{result[m]?.toLocaleString() || 0}</td>)}</tr></tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Billing Component
function Billing() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/billing/plans'),
      api.get('/billing/subscription')
    ]).then(([plansData, subData]) => {
      setPlans(plansData.plans || []);
      setSubscription(subData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const subscribe = async (planId) => {
    await api.post('/billing/subscribe', { plan_id: planId });
    const subData = await api.get('/billing/subscription');
    setSubscription(subData);
  };

  if (loading) return <div className="loading">Loading billing...</div>;

  return (
    <div>
      <div className="header">
        <h2>Billing</h2>
        <p>Manage your DataVault subscription</p>
      </div>
      
      {subscription?.subscription && (
        <div className="card" style={{ marginBottom: 20, background: '#1e3a5f' }}>
          <h3>Current Plan</h3>
          <p style={{ fontSize: 24, fontWeight: 'bold', margin: '12px 0' }}>
            {subscription.plan?.name} - ${subscription.plan?.price}/mo
          </p>
          <p style={{ color: '#a1a1aa' }}>Status: {subscription.subscription.status}</p>
        </div>
      )}
      
      <div className="grid-3">
        {plans.map(plan => (
          <div key={plan.id} className="card">
            <h3 style={{ marginBottom: 8 }}>{plan.name}</h3>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>
              ${plan.price}<span style={{ fontSize: 14, color: '#71717a' }}>/mo</span>
            </div>
            <ul style={{ listStyle: 'none', marginBottom: 20 }}>
              {plan.features.map((f, i) => <li key={i} style={{ marginBottom: 8, color: '#a1a1aa' }}>✓ {f}</li>)}
            </ul>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => subscribe(plan.id)}
              disabled={subscription?.plan?.id === plan.id}
            >
              {subscription?.plan?.id === plan.id ? 'Current Plan' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'customers': return <Customers />;
      case 'segments': return <Segments />;
      case 'cohorts': return <Cohorts />;
      case 'analytics': return <Analytics />;
      case 'reports': return <Reports />;
      case 'billing': return <Billing />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <div className="sidebar">
        <div className="logo">
          <h1>DataVault</h1>
          <span>Customer Analytics</span>
        </div>
        {NAV_ITEMS.map(item => (
          <div 
            key={item.id} 
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="main">{renderPage()}</div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
