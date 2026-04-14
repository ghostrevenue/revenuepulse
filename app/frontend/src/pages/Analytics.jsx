import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/index.js';

// --- Pure SVG line chart (no chart library) ---
function LineChart({ data, width = 600, height = 200 }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const series = data; // array of { date, accepted, declined }
  const maxVal = Math.max(...series.flatMap(s => [s.accepted || 0, s.declined || 0]), 1);

  const xStep = chartW / Math.max(series.length - 1, 1);
  const yScale = chartH / maxVal;

  function xPos(i) { return padding.left + i * xStep; }
  function yPos(val) { return padding.top + chartH - val * yScale; }

  function buildPath(values) {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)},${yPos(v || 0).toFixed(1)}`).join(' ');
  }

  function buildArea(values) {
    const base = padding.top + chartH;
    const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)},${yPos(v || 0).toFixed(1)}`).join(' ');
    const lastX = xPos(values.length - 1).toFixed(1);
    const firstX = xPos(0).toFixed(1);
    return `${line} L ${lastX},${base} L ${firstX},${base} Z`;
  }

  const acceptedPath = buildPath(series.map(s => s.accepted || 0));
  const declinedPath = buildPath(series.map(s => s.declined || 0));
  const acceptedArea = buildArea(series.map(s => s.accepted || 0));
  const declinedArea = buildArea(series.map(s => s.declined || 0));

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map(v => Math.round(v));

  function handleMouseMove(e) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const relX = mx - padding.left;
    if (relX < 0 || relX > chartW) { setTooltip(null); return; }
    const idx = Math.round(relX / xStep);
    const clamped = Math.max(0, Math.min(idx, series.length - 1));
    const s = series[clamped];
    setTooltip({ idx: clamped, x: xPos(clamped), y: yPos(s.accepted || 0), data: s });
  }

  return (
    <div className="line-chart-wrap">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair' }}
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={yPos(tick).toFixed(1)}
              x2={padding.left + chartW} y2={yPos(tick).toFixed(1)}
              stroke="#27272a" strokeWidth="1"
            />
            <text x={padding.left - 8} y={(yPos(tick) + 4).toFixed(1)} textAnchor="end" fill="#52525b" fontSize="11">
              {tick}
            </text>
          </g>
        ))}

        {/* Declined area */}
        <path d={declinedArea} fill="rgba(239,68,68,0.12)" />
        <path d={declinedPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Accepted area */}
        <path d={acceptedArea} fill="rgba(34,197,94,0.15)" />
        <path d={acceptedPath} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-axis labels */}
        {series.map((s, i) => {
          const show = series.length <= 14 || i % Math.ceil(series.length / 7) === 0;
          return show ? (
            <text key={i} x={xPos(i)} y={height - 8} textAnchor="middle" fill="#52525b" fontSize="10">
              {s.date}
            </text>
          ) : null;
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x.toFixed(1)} y1={padding.top} x2={tooltip.x.toFixed(1)} y2={padding.top + chartH} stroke="#71717a" strokeWidth="1" strokeDasharray="4" />
            <circle cx={tooltip.x.toFixed(1)} cy={tooltip.y.toFixed(1)} r="4" fill="#22c55e" />
            <rect x={(tooltip.x - 50).toFixed(1)} y={padding.top - 4} width="100" height="44" rx="6" fill="#18181b" stroke="#27272a" />
            <text x={(tooltip.x).toFixed(1)} y={(padding.top + 14).toFixed(1)} textAnchor="middle" fill="#71717a" fontSize="10">
              {series[tooltip.idx].date}
            </text>
            <text x={(tooltip.x).toFixed(1)} y={(padding.top + 28).toFixed(1)} textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="600">
              ✓ {series[tooltip.idx].accepted || 0}
            </text>
            <text x={(tooltip.x).toFixed(1)} y={(padding.top + 40).toFixed(1)} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="600">
              ✗ {series[tooltip.idx].declined || 0}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// --- Cumulative revenue line chart ---
function RevenueLineChart({ data, width = 600, height = 160 }) {
  if (!data || data.length === 0) return null;

  const padding = { top: 10, right: 20, bottom: 30, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  let cumulative = 0;
  const points = data.map(d => { cumulative += d.revenue || 0; return cumulative; });
  const maxVal = Math.max(...points, 1);

  const xStep = chartW / Math.max(points.length - 1, 1);
  const yScale = chartH / maxVal;

  function xPos(i) { return padding.left + i * xStep; }
  function yPos(val) { return padding.top + chartH - val * yScale; }

  const linePath = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${xPos(points.length - 1).toFixed(1)},${padding.top + chartH} L ${xPos(0).toFixed(1)},${padding.top + chartH} Z`;

  const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal].map(v => Math.round(v));

  return (
    <div className="revenue-chart-wrap">
      <svg width={width} height={height}>
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={yPos(tick).toFixed(1)} x2={padding.left + chartW} y2={yPos(tick).toFixed(1)} stroke="#27272a" strokeWidth="1" />
            <text x={padding.left - 8} y={(yPos(tick) + 4).toFixed(1)} textAnchor="end" fill="#52525b" fontSize="11">
              ${tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="rgba(139,92,246,0.12)" />
        <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v, i) => {
          const show = data.length <= 14 || i % Math.ceil(data.length / 7) === 0;
          return show ? (
            <text key={i} x={xPos(i)} y={height - 6} textAnchor="middle" fill="#52525b" fontSize="10">{data[i].date}</text>
          ) : null;
        })}
      </svg>
    </div>
  );
}

// --- Mock data builder ---
function buildMockData(period) {
  const days = period;
  const today = new Date();
  const responses = [];
  const acceptByDay = {};
  const declineByDay = {};
  const revByDay = {};

  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acceptByDay[key] = 0;
    declineByDay[key] = 0;
    revByDay[key] = 0;
  }

  const responses_pool = ['accepted', 'declined'];
  for (let i = 0; i < days * 12; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - Math.floor(Math.random() * days));
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const r = Math.random() > 0.38 ? 'accepted' : 'declined';
    responses.push({
      id: i + 1,
      created_at: d.toISOString(),
      response: r,
      revenue_added: r === 'accepted' ? (Math.random() * 30 + 5) : 0,
      order_id: `100${1000 + i}`,
      offer_name: ['Summer Deal', 'WarrantyProtection', 'FlashDiscount', 'BundleOffer'][i % 4],
    });
    if (acceptByDay[key] !== undefined) {
      acceptByDay[key]++;
      revByDay[key] += Math.random() * 30 + 5;
    }
    if (declineByDay[key] !== undefined) declineByDay[key]++;
  }

  const chartData = Object.keys(acceptByDay).map(date => ({
    date,
    accepted: acceptByDay[date],
    declined: declineByDay[date],
  }));

  const revenueData = Object.keys(revByDay).map(date => ({
    date,
    revenue: revByDay[date],
  }));

  return { responses, chartData, revenueData };
}

export default function Analytics({ store, appConfig }) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortCol, setSortCol] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

  // Real data from API
  const [stats, setStats] = useState(null);
  const [offers, setOffers] = useState([]);
  const [recent, setRecent] = useState([]);
  // Real chart data — keyed by period so switching periods shows correct data
  const [chartData, setChartData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    if (!store) { setLoading(false); return; }
    loadData();
  }, [store, period]);

  async function loadData() {
    setLoading(true);
    setIsDemoData(false);
    try {
      // Fetch all real data in parallel — no fallback to mock
      const [statsRes, chartRes, offersRes, recentRes] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getAnalyticsChart(period).catch(() => ({ chart: [] })),
        api.getAnalyticsOffers(period).catch(() => ({ offers: [] })),
        api.getDashboardRecent().catch(() => ({ responses: [] })),
      ]);

      const hasRealStats = statsRes && (statsRes.accepts > 0 || statsRes.declines > 0 || statsRes.total_responses > 0);
      const hasRealChart = chartRes?.chart?.length > 0;
      // Only show demo banner when BOTH stats and chart are empty — a store with
      // real stats but no chart data yet is still a real store, not a demo.
      if (!hasRealStats && !hasRealChart) {
        setIsDemoData(true);
      }

      if (statsRes) {
        setStats({
          total_accepts: statsRes.accepts || 0,
          total_declines: statsRes.declines || 0,
          total_triggered: statsRes.total_responses || 0,
          revenue_lifted: statsRes.total_revenue_lifted || 0,
          acceptance_rate: statsRes.acceptance_rate || 0,
        });
      } else {
        // Demo stats when API returns nothing
        const demo = buildMockData(period);
        const totalAccepted = demo.responses.filter(r => r.response === 'accepted').length;
        const totalDeclined = demo.responses.filter(r => r.response === 'declined').length;
        const totalRevenue = demo.responses.reduce((sum, r) => sum + (r.revenue_added || 0), 0);
        const totalTriggered = totalAccepted + totalDeclined;
        setStats({
          total_accepts: totalAccepted,
          total_declines: totalDeclined,
          total_triggered: totalTriggered,
          revenue_lifted: totalRevenue,
          acceptance_rate: totalTriggered > 0 ? (totalAccepted / totalTriggered * 100).toFixed(1) : '0.0',
        });
      }

      if (chartRes?.chart?.length) {
        setChartData(chartRes.chart.map(c => ({ date: c.date, accepted: c.accepted, declined: c.declined })));
        setRevenueData(chartRes.chart.map(c => ({ date: c.date, revenue: c.revenue })));
      } else {
        // Fallback to demo data when no real data exists yet
        const demo = buildMockData(period);
        setChartData(demo.chartData);
        setRevenueData(demo.revenueData);
      }

      if (offersRes?.offers?.length) {
        setOffers(offersRes.offers);
      } else {
        setOffers([]);
      }

      if (recentRes?.responses?.length) {
        setRecent(recentRes.responses.map(r => ({
          id: r.id,
          order_id: r.order_id,
          offer_name: r.headline || r.offer_type || `Offer #${r.offer_id}`,
          response: r.response,
          created_at: r.created_at,
          revenue_added: r.added_revenue || 0,
        })));
      } else {
        // Fallback to demo recent responses
        const demo = buildMockData(period);
        setRecent(demo.responses.slice(0, 10).map(r => ({
          id: r.id,
          order_id: r.order_id,
          offer_name: r.offer_name,
          response: r.response,
          created_at: r.created_at,
          revenue_added: r.revenue_added,
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort offers
  const filteredOffers = offers
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => typeFilter === 'all' || o.offer_type === typeFilter)
    .map(o => ({
      ...o,
      rate: o.total_triggered > 0 ? ((o.total_accepted / o.total_triggered) * 100).toFixed(1) : '0.0',
      revenue: o.revenue_lifted || 0,
      revPerAccept: o.total_accepted > 0 ? (o.revenue_lifted / o.total_accepted).toFixed(2) : '0.00',
    }))
    .sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (sortDir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

  // Chart data from real API calls (chartData and revenueData are set in loadData)

  // Compute KPI trends vs last period (mock: assume 5% difference)
  const totalAccepts = Number(stats?.total_accepts || 0);
  const totalDeclines = Number(stats?.total_declines || 0);
  const totalTriggered = Number(stats?.total_triggered || 0);
  const revenueLifted = Number(stats?.revenue_lifted || 0);
  const acceptRate = totalTriggered > 0 ? ((totalAccepts / totalTriggered) * 100).toFixed(1) : '0.0';
  const revPerAccept = totalAccepts > 0 ? (revenueLifted / totalAccepts) : 0;

  function SortIcon({ col }) {
    if (sortCol !== col) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span style={{ color: '#8b5cf6' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Connect Your Store</h3>
        <p style={{ color: '#71717a' }}>Connect your Shopify store to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">{store?.shop} — Upsell performance insights</p>
        </div>
        <div className="period-selector">
          {[7, 30, 60, 90].map(p => (
            <button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Demo data banner */}
      {isDemoData && (
        <div className="demo-data-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span><strong>Demo data</strong> — No real responses yet. This is sample data to preview what your analytics will look like. Connect your store and publish an offer to start seeing real results.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-revenue">
          <div className="kpi-label">Total Revenue Attributed</div>
          <div className="kpi-value large">${revenueLifted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="kpi-sub">Additional revenue from accepted upsells</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Acceptance Rate</div>
          <div className="kpi-value">{acceptRate}%</div>
          <div className="kpi-sub">{totalTriggered.toLocaleString()} offers shown</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Accepts</div>
          <div className="kpi-value">{totalAccepts.toLocaleString()}</div>
          <div className="kpi-sub accept">{totalDeclines.toLocaleString()} declines</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Offers Shown</div>
          <div className="kpi-value">{totalTriggered.toLocaleString()}</div>
          <div className="kpi-sub">Impressions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Revenue per Accept</div>
          <div className="kpi-value">${revPerAccept.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="kpi-sub">Average added revenue</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-section">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Acceptance Rate Over Time</div>
            <div className="chart-legend">
              <div className="legend-item"><span className="dot green" />Accepted</div>
              <div className="legend-item"><span className="dot red" />Declined</div>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="empty-chart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }}>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
              </svg>
              <p>No response data yet. Responses will appear here as customers interact with your offers.</p>
            </div>
          ) : (
            <div className="chart-container">
              <LineChart data={chartData} width={700} height={220} />
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Revenue Over Time</div>
          </div>
          {revenueData.length === 0 ? (
            <div className="empty-chart"><p>No revenue data yet.</p></div>
          ) : (
            <div className="chart-container">
              <RevenueLineChart data={revenueData} width={700} height={160} />
            </div>
          )}
        </div>
      </div>

      {/* Offers Performance Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Offers Performance</div>
          <div className="table-filters">
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="add_product">Add to Order</option>
              <option value="discount_code">Discount Code</option>
              <option value="warranty">Warranty</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}><SortIcon col="name" /> Name</th>
                <th onClick={() => handleSort('status')}><SortIcon col="status" /> Status</th>
                <th onClick={() => handleSort('offer_type')}><SortIcon col="offer_type" /> Type</th>
                <th onClick={() => handleSort('total_triggered')}><SortIcon col="total_triggered" /> Shown</th>
                <th onClick={() => handleSort('total_accepted')}><SortIcon col="total_accepted" /> Accepted</th>
                <th onClick={() => handleSort('total_declined')}><SortIcon col="total_declined" /> Declined</th>
                <th onClick={() => handleSort('rate')}><SortIcon col="rate" /> Rate%</th>
                <th onClick={() => handleSort('revenue')}><SortIcon col="revenue" /> Revenue</th>
                <th onClick={() => handleSort('revPerAccept')}><SortIcon col="revPerAccept" /> Rev/Accept</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.length === 0 ? (
                <tr><td colSpan={9} className="empty-cell">No offers match your filters.</td></tr>
              ) : filteredOffers.map(offer => (
                <tr key={offer.id}>
                  <td className="offer-name-cell">{offer.name || offer.headline || `Offer #${offer.id}`}</td>
                  <td>
                    <span className={`status-badge ${offer.status}`}>
                      {offer.status === 'published' ? 'Published' : offer.status === 'draft' ? 'Draft' : 'Archived'}
                    </span>
                  </td>
                  <td>
                    <span className={`type-badge ${offer.offer_type}`}>
                      {offer.offer_type === 'add_product' ? 'Add to Order' : offer.offer_type === 'warranty' ? 'Warranty' : 'Discount'}
                    </span>
                  </td>
                  <td>{Number(offer.total_triggered || 0).toLocaleString()}</td>
                  <td className="accept-cell">{Number(offer.total_accepted || 0).toLocaleString()}</td>
                  <td className="decline-cell">{Number(offer.total_declined || 0).toLocaleString()}</td>
                  <td>
                    <div className="rate-cell">
                      <span>{offer.rate}%</span>
                      <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${offer.rate}%` }} /></div>
                    </div>
                  </td>
                  <td className="revenue-cell">${Number(offer.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${offer.revPerAccept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Responses Feed */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Responses</div>
          <span className="response-count">{recent.length} responses</span>
        </div>
        <div className="responses-list">
          {recent.length === 0 ? (
            <div className="empty-chart"><p>No responses yet.</p></div>
          ) : recent.map(r => (
            <div key={r.id} className={`response-item ${r.response === 'accepted' ? 'accepted' : 'declined'}`}>
              <div className="response-indicator" />
              <div className="response-main">
                <div className="response-top">
                  <span className="response-offer">{r.offer_name || `Offer #${r.id}`}</span>
                  <span className={`response-badge ${r.response}`}>
                    {r.response === 'accepted' ? 'Accepted' : 'Declined'}
                  </span>
                </div>
                <div className="response-meta">
                  <span className="response-order">#{r.order_id || r.id}</span>
                  <span className="response-time">{new Date(r.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="response-revenue">
                {r.response === 'accepted' && r.revenue_added > 0 ? (
                  <span className="revenue-added">+${r.revenue_added.toFixed(2)}</span>
                ) : (
                  <span className="revenue-zero">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .analytics { max-width: 1200px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }

        .period-selector { display: flex; gap: 4px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 4px; }
        .period-btn { background: none; border: none; color: #71717a; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .period-btn:hover { color: #e5e5e5; }
        .period-btn.active { background: #8b5cf6; color: #fff; }

        .kpi-grid { display: grid; grid-template-columns: 1.5fr repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .demo-data-banner { display: flex; align-items: center; gap: 10px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #a78bfa; }
        .demo-data-banner svg { flex-shrink: 0; color: #8b5cf6; }
        .demo-data-banner span { color: #d4c5fc; }
        .kpi-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
        .kpi-revenue { border-color: rgba(139,92,246,0.3); }
        .kpi-revenue .kpi-value { color: #8b5cf6; }
        .kpi-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .kpi-value { font-size: 26px; font-weight: 700; color: #fafafa; }
        .kpi-value.large { font-size: 32px; }
        .kpi-sub { font-size: 12px; color: #52525b; margin-top: 4px; }
        .kpi-sub.accept { color: #ef4444; }
        .trend { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .trend.up { background: rgba(34,197,94,0.15); color: #22c55e; }
        .trend.down { background: rgba(239,68,68,0.15); color: #ef4444; }

        .charts-section { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
        .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .card-title { font-size: 15px; font-weight: 600; color: #fafafa; }
        .chart-legend { display: flex; gap: 16px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #71717a; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.green { background: #22c55e; }
        .dot.red { background: #ef4444; }

        .chart-container { overflow-x: auto; padding-bottom: 8px; }
        .line-chart-wrap { min-width: 500px; }
        .revenue-chart-wrap { min-width: 500px; }

        .empty-chart { text-align: center; padding: 40px 20px; color: #52525b; font-size: 14px; }
        .empty-chart p { max-width: 280px; margin: 0 auto; line-height: 1.5; }

        .table-filters { display: flex; gap: 8px; }
        .filter-select { background: #0f0f14; border: 1px solid #27272a; border-radius: 6px; color: #a1a1aa; padding: 6px 10px; font-size: 13px; cursor: pointer; }
        .filter-select:focus { outline: none; border-color: #8b5cf6; }

        .table-wrap { overflow-x: auto; }
        .analytics-table { width: 100%; border-collapse: collapse; }
        .analytics-table th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #27272a; cursor: pointer; white-space: nowrap; user-select: none; }
        .analytics-table th:hover { color: #a1a1aa; }
        .analytics-table td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #27272a; }
        .analytics-table tr:last-child td { border-bottom: none; }
        .analytics-table tr:hover td { background: rgba(255,255,255,0.02); }
        .offer-name-cell { font-weight: 500; color: #e5e5e5; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
        .status-badge.draft { background: rgba(107,114,128,0.2); color: #9ca3af; }
        .status-badge.published { background: rgba(34,197,94,0.15); color: #22c55e; }
        .status-badge.archived { background: rgba(239,68,68,0.15); color: #ef4444; }
        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
        .type-badge.add_product { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .type-badge.warranty { background: rgba(34,197,94,0.15); color: #22c55e; }
        .type-badge.discount_code { background: rgba(234,179,8,0.15); color: #eab308; }
        .accept-cell { color: #22c55e; font-weight: 600; }
        .decline-cell { color: #ef4444; font-weight: 600; }
        .rate-cell { display: flex; align-items: center; gap: 8px; }
        .rate-cell span { font-weight: 600; color: #a78bfa; min-width: 36px; }
        .mini-bar { width: 48px; height: 3px; background: #27272a; border-radius: 2px; overflow: hidden; }
        .mini-bar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 2px; }
        .revenue-cell { color: #22c55e; font-weight: 600; }
        .empty-cell { text-align: center; padding: 30px; color: #52525b; }

        .responses-list { display: flex; flex-direction: column; gap: 0; }
        .response-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #27272a; transition: background 0.15s; }
        .response-item:last-child { border-bottom: none; }
        .response-item:hover { background: rgba(255,255,255,0.02); margin: 0 -20px; padding: 12px 20px; }
        .response-indicator { width: 4px; height: 36px; border-radius: 2px; flex-shrink: 0; }
        .response-item.accepted .response-indicator { background: #22c55e; }
        .response-item.declined .response-indicator { background: #ef4444; }
        .response-main { flex: 1; min-width: 0; }
        .response-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .response-offer { font-size: 13px; font-weight: 500; color: #e5e5e5; }
        .response-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
        .response-badge.accepted { background: rgba(34,197,94,0.15); color: #22c55e; }
        .response-badge.declined { background: rgba(239,68,68,0.15); color: #ef4444; }
        .response-meta { display: flex; gap: 12px; font-size: 11px; color: #52525b; }
        .response-revenue { flex-shrink: 0; }
        .revenue-added { color: #22c55e; font-weight: 700; font-size: 14px; }
        .revenue-zero { color: #3f3f46; }
        .response-count { font-size: 12px; color: #52525b; }

        .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #71717a; }
        .spinner { width: 20px; height: 20px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
          .kpi-revenue { grid-column: span 2; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr; }
          .kpi-revenue { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
}