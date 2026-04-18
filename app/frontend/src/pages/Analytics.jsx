import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';

// ── Mock Data (shown when no real data available) ─────────────────────────────

const DEMO_FUNNEL = {
  name: 'Demo Funnel',
  nodes: [
    { id: 'd1', headline: 'Add a Product', product: { title: 'Sample Product', image_url: '' }, discount: { type: 'percentage', value: 15 }, position: { x: 0, y: 80 }, on_accept_node_id: null, on_decline_node_id: null },
  ],
};

const DEMO_METRICS = {
  impressions: 0, accepts: 0, declines: 0, revenue: 0,
  avgOrderValue: 0, baselineAOV: 0,
  nodes: { d1: { impressions: 0, accepts: 0, declines: 0, revenue: 0 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDiscountLabel(discount) {
  if (!discount || discount.value <= 0) return null;
  if (discount.type === 'percentage') return `${discount.value}% off`;
  if (discount.type === 'fixed_amount') return `$${discount.value} off`;
  if (discount.type === 'fixed_price') return `$${discount.value}`;
  return null;
}

function getDiscountedPrice(node) {
  if (!node.product?.original_price || !node.discount?.value) return null;
  const orig = parseFloat(node.product.original_price);
  if (node.discount.type === 'percentage') return orig * (1 - node.discount.value / 100);
  if (node.discount.type === 'fixed_amount') return orig - node.discount.value;
  if (node.discount.type === 'fixed_price') return node.discount.value;
  return null;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#8b5cf6', width = 80, height = 28 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Stat Card Icons ────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sublabel, valueColor, subColor, sparkline }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={valueColor ? { color: valueColor } : {}}>{value}</div>
        {sublabel && <div className="stat-sub" style={subColor ? { color: subColor } : {}}>{sublabel}</div>}
      </div>
      {sparkline && <div className="stat-sparkline">{sparkline}</div>}
    </div>
  );
}

// ── Edge Line ─────────────────────────────────────────────────────────────────

function EdgeLine({ edge, nodes, metrics }) {
  const fromNode = edge.from;
  const toNode = nodes.find(n => n.id === edge.toId);
  if (!fromNode || !toNode) return null;

  const isAccept = edge.type === 'accept';
  const sx = fromNode.position.x + (isAccept ? 186 : 14);
  const sy = fromNode.position.y + 110;
  const tx = toNode.position.x + 100;
  const ty = toNode.position.y;
  const color = isAccept ? '#22c55e' : '#ef4444';
  const midY = (sy + ty) / 2;
  const path = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
  const fromMetrics = metrics?.nodes?.[fromNode.id];
  if (!fromMetrics) return null;

  const totalFromImpressions = fromMetrics.impressions || 0;
  const edgeConversions = isAccept ? (fromMetrics.accepts || 0) : (fromMetrics.declines || 0);
  const convPct = totalFromImpressions > 0 ? ((edgeConversions / totalFromImpressions) * 100).toFixed(0) : '0';
  const labelX = (sx + tx) / 2;
  const labelY = (sy + ty) / 2;

  return (
    <g>
      <path d={path} stroke={color} strokeWidth="2" fill="none" />
      <circle cx={tx} cy={ty} r="4" fill={color} />
      <rect x={labelX - 32} y={labelY - 12} width="64" height="22" rx="11" fill={color} fillOpacity="0.15" />
      <text x={labelX} y={labelY + 4} textAnchor="middle" fill={color} fontSize="11" fontWeight="700">
        {convPct}% {isAccept ? '✓' : '✗'}
      </text>
    </g>
  );
}

// ── Funnel Graph ──────────────────────────────────────────────────────────────

function FunnelGraph({ funnel, metrics, selectedNodeId, onNodeClick }) {
  if (!funnel || !funnel.nodes || funnel.nodes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#52525b', fontSize: 14 }}>
        No funnel data available yet
      </div>
    );
  }

  const edges = [];
  funnel.nodes.forEach(node => {
    if (node.on_accept_node_id) edges.push({ id: `${node.id}-accept`, from: node, toId: node.on_accept_node_id, type: 'accept' });
    if (node.on_decline_node_id) edges.push({ id: `${node.id}-decline`, from: node, toId: node.on_decline_node_id, type: 'decline' });
  });

  const canvasW = 520;
  const canvasH = 320;

  return (
    <div className="funnel-graph-wrap">
      <svg width={canvasW} height={canvasH} className="funnel-graph-svg">
        <defs>
          <filter id="glow-purple">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {edges.map(edge => (
          <EdgeLine key={edge.id} edge={edge} nodes={funnel.nodes} metrics={metrics} />
        ))}
        <g transform="translate(430, 120)">
          <rect width="80" height="50" rx="25" fill="#18181b" stroke="#27272a" strokeWidth="1" />
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" width="18" height="18" x="31" y="16">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <text x="40" y="40" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="500">Thank You</text>
        </g>
        {funnel.nodes.map((node, idx) => {
          const isSelected = selectedNodeId === node.id;
          const nodeMetrics = metrics?.nodes?.[node.id];
          const acceptPct = nodeMetrics?.impressions > 0
            ? ((nodeMetrics.accepts / nodeMetrics.impressions) * 100).toFixed(1)
            : null;
          return (
            <g
              key={node.id}
              transform={`translate(${node.position?.x || 0}, ${node.position?.y || 0})`}
              className={`funnel-node-group ${isSelected ? 'selected' : ''}`}
              onClick={() => onNodeClick(node.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect width="200" height="110" rx="12" fill="#1e1e24" stroke={isSelected ? '#8b5cf6' : '#27272a'} strokeWidth={isSelected ? 2 : 1}
                style={{ filter: isSelected ? 'url(#glow-purple)' : 'none', transition: 'all 0.15s' }} />
              <rect x="10" y="10" width="20" height="20" rx="10" fill={isSelected ? '#8b5cf6' : '#27272a'} />
              <text x="20" y="24" textAnchor="middle" fill={isSelected ? '#fff' : '#71717a'} fontSize="11" fontWeight="600">{idx + 1}</text>
              {node.product?.image_url ? (
                <image href={node.product.image_url} x="38" y="8" width="40" height="40" clipPath={`url(#clip-${node.id})`} />
              ) : (
                <rect x="38" y="8" width="40" height="40" rx="6" fill="#27272a" />
              )}
              <clipPath id={`clip-${node.id}`}>
                <rect x="38" y="8" width="40" height="40" rx="6" />
              </clipPath>
              <text x="10" y="62" fill="#fafafa" fontSize="12" fontWeight="600">
                {node.headline ? (node.headline.length > 22 ? node.headline.slice(0, 22) + '…' : node.headline) : 'Untitled'}
              </text>
              {node.discount?.value > 0 && (
                <>
                  <rect x="10" y="72" width="56" height="18" rx="9" fill="#8b5cf6" fillOpacity="0.2" />
                  <text x="38" y="84" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="700">{getDiscountLabel(node.discount)}</text>
                </>
              )}
              {nodeMetrics && (
                <g transform="translate(0, 115)">
                  <text x="0" y="0" fill="#71717a" fontSize="10">{nodeMetrics.impressions.toLocaleString()} shown</text>
                  {acceptPct !== null && (
                    <text x="100" y="0" fill="#22c55e" fontSize="10" fontWeight="600">{acceptPct}% accept</text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Metrics Table ─────────────────────────────────────────────────────────────

function MetricsTable({ funnel, metrics }) {
  if (!funnel || !funnel.nodes || funnel.nodes.length === 0) return null;

  return (
    <div className="metrics-table-wrap">
      <table className="metrics-table">
        <thead>
          <tr>
            <th>#</th><th>Product</th><th>Impressions</th><th>Accept %</th><th>Decline %</th><th>Revenue</th><th>AOV Lift</th>
          </tr>
        </thead>
        <tbody>
          {funnel.nodes.map((node, idx) => {
            const m = metrics?.nodes?.[node.id];
            if (!m) return null;
            const acceptPct = m.impressions > 0 ? ((m.accepts / m.impressions) * 100).toFixed(1) : '0.0';
            const declinePct = m.impressions > 0 ? ((m.declines / m.impressions) * 100).toFixed(1) : '0.0';

            let nodeAovLift = null;
            if (node.product?.original_price && node.discount?.value) {
              const discPrice = getDiscountedPrice(node);
              if (discPrice && metrics?.baselineAOV > 0) {
                nodeAovLift = ((discPrice / metrics.baselineAOV) - 1) * 100;
              }
            }

            return (
              <tr key={node.id} id={`node-row-${node.id}`}>
                <td className="node-num">{idx + 1}</td>
                <td className="node-product">
                  <span className="product-name">{node.product?.title || '—'}</span>
                  {node.headline && <span className="product-headline">{node.headline}</span>}
                </td>
                <td className="node-impressions">{m.impressions.toLocaleString()}</td>
                <td><span className="pct-badge accept">{acceptPct}%</span></td>
                <td><span className="pct-badge decline">{declinePct}%</span></td>
                <td className="node-revenue">${m.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                  {nodeAovLift !== null ? (
                    <span className={`aov-lift-badge ${nodeAovLift >= 0 ? 'positive' : 'negative'}`}>
                      {nodeAovLift >= 0 ? '+' : ''}{nodeAovLift.toFixed(1)}%
                    </span>
                  ) : <span className="muted-dash">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="empty-state-analytics">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56" style={{ opacity: 0.2 }}>
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
      <h3>No analytics yet</h3>
      <p>Create and publish upsell offers to see performance data here.</p>
      <button className="btn-primary" onClick={() => window.location.hash = '#/offers'}>
        Create Your First Offer →
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Analytics({ store }) {
  const [dateRange, setDateRange] = useState('30');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const tableRef = useRef(null);

  // Real data states
  const [funnelData, setFunnelData] = useState(null);     // { funnel, metrics }
  const [chartData, setChartData] = useState(null);        // { labels, accepts, declines, revenue }
  const [statsData, setStatsData] = useState(null);        // { impressions, accepts, revenue, ... }
  const [loading, setLoading] = useState(true);

  // Fetch all analytics data
  useEffect(() => {
    if (!store) { setLoading(false); return; }
    setLoading(true);

    Promise.all([
      // Get funnel + metrics from upsell offers
      api.getUpsellOffers().catch(() => ({ offers: [] })),
      // Get aggregate stats
      api.getDashboardStats().catch(() => ({})),
      // Get chart data
      api.getAnalyticsChart(dateRange).catch(() => null),
      // Get per-offer analytics
      api.getAnalyticsOffers(dateRange).catch(() => null),
    ]).then(([offersResult, statsResult, chartResult, offersAnalyticsResult]) => {
      // Build funnel from real offers
      const realFunnel = buildFunnelFromOffers(offersResult);
      const realMetrics = buildMetricsFromOffers(offersResult, offersAnalyticsResult, statsResult);

      setFunnelData({ funnel: realFunnel, metrics: realMetrics });
      setStatsData(statsResult || {});
      setChartData(chartResult);
    }).finally(() => setLoading(false));
  }, [store, dateRange]);

  function buildFunnelFromOffers(offersResult) {
    // Build funnel from the first active offer's nodes, or use demo
    const offers = offersResult?.offers || [];
    const activeOffer = offers.find(o => o.active) || offers[0];
    if (!activeOffer) return DEMO_FUNNEL;
    if (activeOffer.nodes && activeOffer.nodes.length > 0) return activeOffer;
    // Fallback: single node offer
    return {
      name: activeOffer.name || 'Upsell Funnel',
      nodes: [{
        id: String(activeOffer.id),
        headline: activeOffer.headline || activeOffer.name || 'Upsell Offer',
        product: activeOffer.product || { title: activeOffer.name || 'Product' },
        discount: activeOffer.discount || { type: 'percentage', value: 10 },
        position: { x: 0, y: 80 },
        on_accept_node_id: null,
        on_decline_node_id: null,
      }],
    };
  }

  function buildMetricsFromOffers(offersResult, offersAnalyticsResult, statsResult) {
    const offers = offersResult?.offers || [];
    const analyticsOffers = offersAnalyticsResult?.offers || [];

    // Get per-node metrics from analytics offers
    const nodes = {};
    let totalImpressions = 0, totalAccepts = 0, totalDeclines = 0, totalRevenue = 0;

    offers.forEach(offer => {
      const analytics = analyticsOffers.find(a => a.id === offer.id) || {};
      const nodeId = String(offer.id);
      const impressions = analytics.total_triggered || statsResult?.requests || offer.impressions || 0;
      const accepts = analytics.total_accepted || offer.accepts || 0;
      const declines = analytics.total_declined || offer.declines || 0;
      const revenue = analytics.revenue_lifted || offer.revenue_lifted || 0;

      nodes[nodeId] = { impressions, accepts, declines, revenue };
      totalImpressions += impressions;
      totalAccepts += accepts;
      totalDeclines += declines;
      totalRevenue += revenue;
    });

    if (offers.length === 0) return DEMO_METRICS;

    return {
      impressions: totalImpressions,
      accepts: totalAccepts,
      declines: totalDeclines,
      revenue: totalRevenue,
      avgOrderValue: statsResult?.revenue_lifted ? (totalAccepts > 0 ? statsResult.revenue_lifted / totalAccepts : 0) : 0,
      baselineAOV: 0,
      nodes,
    };
  }

  function handleExportCSV() {
    const offers = funnelData?.funnel?.nodes || [];
    const metrics = funnelData?.metrics || {};
    if (offers.length === 0) return;
    const rows = [['#', 'Product', 'Headline', 'Impressions', 'Accepts', 'Declines', 'Accept Rate', 'Revenue']];
    offers.forEach((node, idx) => {
      const m = metrics.nodes?.[node.id] || {};
      const rate = m.impressions > 0 ? ((m.accepts / m.impressions) * 100).toFixed(1) : '0.0';
      rows.push([idx + 1, node.product?.title || '—', node.headline || '—', m.impressions || 0, m.accepts || 0, m.declines || 0, rate + '%', '$' + (m.revenue || 0).toFixed(2)]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `revenuepulse-analytics-${dateRange}d.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleNodeClick(nodeId) {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
    if (tableRef.current) {
      const row = document.getElementById(`node-row-${nodeId}`);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Connect Your Store</h3>
        <p style={{ color: '#71717a' }}>Connect your Shopify store to view analytics.</p>
      </div>
    );
  }

  const funnel = funnelData?.funnel || DEMO_FUNNEL;
  const metrics = funnelData?.metrics || DEMO_METRICS;
  const hasRealData = (metrics.impressions > 0 || statsData?.total_revenue_lifted > 0);
  const impressions = hasRealData ? (metrics.impressions || statsData?.requests || 0) : 0;
  const accepts = hasRealData ? (metrics.accepts || statsData?.accepts || 0) : 0;
  const declines = hasRealData ? (metrics.declines || statsData?.declines || 0) : 0;
  const revenue = hasRealData ? (metrics.revenue || statsData?.total_revenue_lifted || 0) : 0;
  const acceptRate = impressions > 0 ? ((accepts / impressions) * 100).toFixed(1) : '0.0';
  const avgAOV = accepts > 0 ? (revenue / accepts) : 0;
  const aovLift = metrics.baselineAOV > 0 && avgAOV > 0 ? (((avgAOV / metrics.baselineAOV) - 1) * 100).toFixed(1) : '0.0';

  const rateColor = parseFloat(acceptRate) > 15 ? '#22c55e' : parseFloat(acceptRate) > 5 ? '#f59e0b' : '#ef4444';
  const revenueColor = '#22c55e';

  // Build sparkline data from chartData
  const chartSparkline = chartData?.revenue?.length >= 2 ? chartData.revenue.slice(-14) : null;
  const acceptSparkline = chartData?.accepts?.length >= 2 ? chartData.accepts.slice(-14) : null;

  const hasFunnelData = funnel && funnel.nodes && funnel.nodes.length > 0 && funnel !== DEMO_FUNNEL;

  return (
    <div className="analytics">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">{store?.shop} — Upsell funnel performance</p>
        </div>
        <div className="analytics-header-actions">
          <button className="btn-export" onClick={handleExportCSV} disabled={!hasRealData} title="Export offer performance to CSV">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <div className="date-range-toggle">
            {['7', '30', '90'].map(d => (
              <button key={d} className={`range-btn ${dateRange === d ? 'active' : ''}`} onClick={() => setDateRange(d)}>
                {d === '7' ? '7D' : d === '30' ? '30D' : '90D'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="analytics-loading">
          <div className="spinner-lg" />
          <span>Loading analytics...</span>
        </div>
      ) : !hasRealData && !hasFunnelData ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats Row */}
          <div className="stats-row">
            <StatCard icon={<EyeIcon />} label="Impressions" value={impressions.toLocaleString()} sublabel="Total customers reached" sparkline={null} />
            <StatCard icon={<CheckIcon />} label="Accept Rate" value={`${acceptRate}%`} sublabel={`${accepts.toLocaleString()} accepted`} valueColor={rateColor} subColor={rateColor} sparkline={acceptSparkline ? <Sparkline data={acceptSparkline} color={rateColor} /> : null} />
            <StatCard icon={<DollarIcon />} label="Revenue" value={`$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sublabel="From accepted offers" valueColor={revenueColor} sparkline={chartSparkline ? <Sparkline data={chartSparkline} color={revenueColor} /> : null} />
            <StatCard icon={<TrendingUpIcon />} label="Avg / Accepted" value={`$${avgAOV.toFixed(2)}`} sublabel={hasRealData ? 'Per accepted upsell' : 'No data yet'} />
          </div>

          {/* Demo data notice */}
          {!hasRealData && hasFunnelData && (
            <div className="demo-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>Funnel configured — publish and activate offers to start seeing real performance data.</span>
            </div>
          )}

          {/* Funnel Visualization */}
          {hasFunnelData && (
            <div className="section">
              <div className="section-title">Funnel Flow</div>
              <div className="funnel-graph-card">
                <FunnelGraph funnel={funnel} metrics={metrics} selectedNodeId={selectedNodeId} onNodeClick={handleNodeClick} />
              </div>
            </div>
          )}

          {/* Per-Node Metrics Table */}
          {hasFunnelData && metrics.nodes && Object.keys(metrics.nodes).length > 0 && (
            <div className="section">
              <div className="section-title">Node Performance</div>
              <div className="metrics-card" ref={tableRef}>
                <MetricsTable funnel={funnel} metrics={metrics} />
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .analytics { max-width: 1100px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }
        .analytics-header-actions { display: flex; gap: 10px; align-items: center; }
        .btn-export { display: flex; align-items: center; gap: 6px; background: #18181b; border: 1px solid #27272a; color: #a1a1aa; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-export:hover { background: #27272a; color: #fafafa; }
        .btn-export:disabled { opacity: 0.4; cursor: not-allowed; }
        .date-range-toggle { display: flex; gap: 4px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 4px; }
        .range-btn { background: none; border: none; color: #71717a; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .range-btn:hover { color: #fafafa; }
        .range-btn.active { background: #8b5cf6; color: #fff; }

        /* Loading */
        .analytics-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 80px; color: #71717a; font-size: 14px; }
        .spinner-lg { width: 28px; height: 28px; border: 3px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Stats row */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .stat-card { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 20px; display: flex; align-items: flex-start; gap: 14px; position: relative; overflow: hidden; transition: border-color 0.15s; }
        .stat-card:hover { border-color: #3f3f46; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #8b5cf6, #7c3aed); border-radius: 14px 14px 0 0; opacity: 0; transition: opacity 0.15s; }
        .stat-card:hover::before { opacity: 1; }
        .stat-icon { width: 36px; height: 36px; background: rgba(139,92,246,0.12); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #a78bfa; flex-shrink: 0; }
        .stat-content { flex: 1; min-width: 0; }
        .stat-label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px; }
        .stat-value { font-size: 26px; font-weight: 800; color: #fafafa; line-height: 1.1; }
        .stat-sub { font-size: 12px; color: #71717a; margin-top: 4px; }
        .stat-sparkline { position: absolute; bottom: 12px; right: 14px; opacity: 0.7; }

        /* Demo notice */
        .demo-notice { display: flex; align-items: center; gap: 10px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); border-radius: 10px; padding: 10px 16px; margin-bottom: 20px; color: #a78bfa; font-size: 13px; }

        /* Sections */
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: 700; color: #fafafa; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .funnel-graph-card { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 20px; overflow-x: auto; }
        .metrics-card { background: #18181b; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; }

        /* Funnel graph */
        .funnel-graph-wrap { display: flex; justify-content: center; }
        .funnel-graph-svg { display: block; }
        .funnel-node-group { transition: filter 0.15s; }
        .funnel-node-group:hover rect:first-child { stroke: #3f3f46; }

        /* Metrics table */
        .metrics-table-wrap { width: 100%; overflow-x: auto; }
        .metrics-table { width: 100%; border-collapse: collapse; }
        .metrics-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #27272a; background: #18181b; }
        .metrics-table td { padding: 12px 16px; font-size: 13px; color: #e5e5e5; border-bottom: 1px solid #27272a; }
        .metrics-table tr:last-child td { border-bottom: none; }
        .metrics-table tr:hover td { background: rgba(139,92,246,0.04); }
        .node-num { color: #52525b; font-weight: 600; }
        .node-product { max-width: 200px; }
        .product-name { display: block; font-weight: 600; color: #fafafa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .product-headline { display: block; font-size: 11px; color: #71717a; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pct-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .pct-badge.accept { background: rgba(34,197,94,0.12); color: #22c55e; }
        .pct-badge.decline { background: rgba(239,68,68,0.12); color: #ef4444; }
        .node-revenue { font-weight: 700; color: #22c55e; }
        .aov-lift-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .aov-lift-badge.positive { background: rgba(34,197,94,0.12); color: #22c55e; }
        .aov-lift-badge.negative { background: rgba(239,68,68,0.12); color: #ef4444; }
        .muted-dash { color: #52525b; }

        /* Empty state */
        .empty-state-analytics { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 40px; text-align: center; gap: 12px; }
        .empty-state-analytics h3 { font-size: 20px; font-weight: 700; color: #fafafa; margin: 0; }
        .empty-state-analytics p { color: #71717a; font-size: 14px; margin: 0; }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #8b5cf6; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: all 0.15s; }
        .btn-primary:hover { background: #7c3aed; transform: translateY(-1px); }

        @media (max-width: 900px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .stats-row { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 16px; }
        }
      `}</style>
    </div>
  );
}
