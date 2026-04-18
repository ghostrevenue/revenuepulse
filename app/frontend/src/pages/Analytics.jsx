import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockFunnel = {
  name: 'Summer Upsell Flow',
  nodes: [
    {
      id: 'n1',
      headline: 'Add the Travel Case',
      product: { title: 'Leather Travel Case', image_url: 'https://picsum.photos/seed/case/200/200' },
      discount: { type: 'percentage', value: 20 },
      position: { x: 0, y: 80 },
      on_accept_node_id: 'n2',
      on_decline_node_id: 'n3',
    },
    {
      id: 'n2',
      headline: 'Complete the Bundle',
      product: { title: 'Premium Care Kit', image_url: 'https://picsum.photos/seed/kit/200/200' },
      discount: { type: 'fixed_amount', value: 15 },
      position: { x: 280, y: 0 },
      on_accept_node_id: null,
      on_decline_node_id: null,
    },
    {
      id: 'n3',
      headline: 'Save 40% — Last Chance',
      product: { title: 'Leather Travel Case', image_url: 'https://picsum.photos/seed/case2/200/200' },
      discount: { type: 'percentage', value: 40 },
      position: { x: 280, y: 160 },
      on_accept_node_id: null,
      on_decline_node_id: null,
    },
  ],
};

const mockMetrics = {
  impressions: 12847,
  accepts: 3842,
  declines: 5210,
  revenue: 94387.50,
  avgOrderValue: 134.20,
  baselineAOV: 124.00,
  nodes: {
    n1: { impressions: 12847, accepts: 3842, declines: 5210, revenue: 3842 * 79.99 },
    n2: { impressions: 3842, accepts: 1537, declines: 2305, revenue: 1537 * 49.99 },
    n3: { impressions: 5210, accepts: 2084, declines: 3126, revenue: 2084 * 29.99 },
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Stat Card Icons (inline SVG) ───────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sublabel, valueColor, subColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={valueColor ? { color: valueColor } : {}}>{value}</div>
        {sublabel && <div className="stat-sub" style={subColor ? { color: subColor } : {}}>{sublabel}</div>}
      </div>
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

  // Mid-point for bezier curve
  const midY = (sy + ty) / 2;
  const path = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

  // Calculate conversion %
  const fromMetrics = metrics.nodes[fromNode.id];
  if (!fromMetrics) return null;

  const totalFromImpressions = fromMetrics.impressions;
  const edgeConversions = isAccept ? fromMetrics.accepts : fromMetrics.declines;
  const convPct = totalFromImpressions > 0 ? ((edgeConversions / totalFromImpressions) * 100).toFixed(0) : '0';

  // Label position: midpoint of the curve
  const labelX = (sx + tx) / 2;
  const labelY = (sy + ty) / 2;

  return (
    <g>
      <path d={path} stroke={color} strokeWidth="2" fill="none" />
      <circle cx={tx} cy={ty} r="4" fill={color} />
      {/* Conversion % label */}
      <rect
        x={labelX - 32}
        y={labelY - 12}
        width="64"
        height="22"
        rx="11"
        fill={color}
        fillOpacity="0.15"
      />
      <text
        x={labelX}
        y={labelY + 4}
        textAnchor="middle"
        fill={color}
        fontSize="11"
        fontWeight="700"
      >
        {convPct}% {isAccept ? '✓' : '✗'}
      </text>
    </g>
  );
}

// ── Funnel Graph ───────────────────────────────────────────────────────────────

function FunnelGraph({ funnel, metrics, selectedNodeId, onNodeClick }) {
  // Build edges from nodes
  const edges = [];
  funnel.nodes.forEach(node => {
    if (node.on_accept_node_id) {
      edges.push({ id: `${node.id}-accept`, from: node, toId: node.on_accept_node_id, type: 'accept' });
    }
    if (node.on_decline_node_id) {
      edges.push({ id: `${node.id}-decline`, from: node, toId: node.on_decline_node_id, type: 'decline' });
    }
  });

  // Canvas size to fit all nodes + thank you
  const canvasW = 520;
  const canvasH = 320;

  return (
    <div className="funnel-graph-wrap">
      <svg width={canvasW} height={canvasH} className="funnel-graph-svg">
        {/* Edges */}
        {edges.map(edge => (
          <EdgeLine key={edge.id} edge={edge} nodes={funnel.nodes} metrics={metrics} />
        ))}

        {/* Thank You terminal node */}
        <g transform="translate(430, 120)">
          <rect width="80" height="50" rx="25" fill="#18181b" stroke="#27272a" strokeWidth="1" />
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" width="18" height="18" x="31" y="16">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <text x="40" y="40" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="500">Thank You</text>
        </g>

        {/* Node cards */}
        {funnel.nodes.map((node, idx) => {
          const isSelected = selectedNodeId === node.id;
          return (
            <g
              key={node.id}
              transform={`translate(${node.position.x}, ${node.position.y})`}
              className={`funnel-node-group ${isSelected ? 'selected' : ''}`}
              onClick={() => onNodeClick(node.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="200"
                height="110"
                rx="12"
                fill="#1e1e24"
                stroke={isSelected ? '#8b5cf6' : '#27272a'}
                strokeWidth={isSelected ? 2 : 1}
              />
              {/* Node index badge */}
              <rect x="10" y="10" width="20" height="20" rx="10" fill="#27272a" />
              <text x="20" y="24" textAnchor="middle" fill="#71717a" fontSize="11" fontWeight="600">{idx + 1}</text>
              {/* Product thumbnail */}
              {node.product?.image_url && (
                <image href={node.product.image_url} x="38" y="8" width="40" height="40" clipPath={`url(#clip-${node.id})`} />
              )}
              <clipPath id={`clip-${node.id}`}>
                <rect x="38" y="8" width="40" height="40" rx="6" />
              </clipPath>
              {/* Headline */}
              <text x="10" y="62" fill="#fafafa" fontSize="12" fontWeight="600">
                {node.headline.length > 22 ? node.headline.slice(0, 22) + '…' : node.headline}
              </text>
              {/* Discount badge */}
              {node.discount?.value > 0 && (
                <rect x="10" y="72" width="56" height="18" rx="9" fill="#8b5cf6" fillOpacity="0.2" />
              )}
              {node.discount?.value > 0 && (
                <text x="38" y="84" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="700">
                  {getDiscountLabel(node.discount)}
                </text>
              )}
              {/* Node metrics below card */}
              {metrics.nodes[node.id] && (
                <g transform="translate(0, 115)">
                  <text x="0" y="0" fill="#71717a" fontSize="10">
                    {metrics.nodes[node.id].impressions.toLocaleString()} impressions
                  </text>
                  <text x="100" y="0" fill="#22c55e" fontSize="10" fontWeight="600">
                    {((metrics.nodes[node.id].accepts / metrics.nodes[node.id].impressions) * 100).toFixed(1)}% accept
                  </text>
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
  return (
    <div className="metrics-table-wrap">
      <table className="metrics-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Impressions</th>
            <th>Accept %</th>
            <th>Decline %</th>
            <th>Revenue</th>
            <th>AOV Lift</th>
          </tr>
        </thead>
        <tbody>
          {funnel.nodes.map((node, idx) => {
            const m = metrics.nodes[node.id];
            if (!m) return null;
            const acceptPct = m.impressions > 0 ? ((m.accepts / m.impressions) * 100).toFixed(1) : '0.0';
            const declinePct = m.impressions > 0 ? ((m.declines / m.impressions) * 100).toFixed(1) : '0.0';

            // Per-node AOV lift: discounted price vs baseline AOV
            let nodeAovLift = null;
            if (node.product?.original_price && node.discount?.value) {
              const discPrice = getDiscountedPrice(node);
              if (discPrice) {
                nodeAovLift = ((discPrice / metrics.baselineAOV) - 1) * 100;
              }
            }

            return (
              <tr key={node.id} id={`node-row-${node.id}`}>
                <td className="node-num">{idx + 1}</td>
                <td className="node-product">
                  <span className="product-name">{node.product?.title || '—'}</span>
                </td>
                <td className="node-impressions">{m.impressions.toLocaleString()}</td>
                <td>
                  <span className="pct-badge accept">{acceptPct}%</span>
                </td>
                <td>
                  <span className="pct-badge decline">{declinePct}%</span>
                </td>
                <td className="node-revenue">
                  ${m.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td>
                  {nodeAovLift !== null ? (
                    <span className={`aov-lift-badge ${nodeAovLift >= 0 ? 'positive' : 'negative'}`}>
                      {nodeAovLift >= 0 ? '+' : ''}{nodeAovLift.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="muted-dash">—</span>
                  )}
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ opacity: 0.25 }}>
        <path d="M3 3h18v18H3z" strokeLinejoin="round" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <h3>Analytics available once your first funnel is active</h3>
      <p>Create a funnel in <strong>Offers</strong> →</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Analytics({ store, appConfig }) {
  const [dateRange, setDateRange] = useState('30'); // '7' | '30' | '90'
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const tableRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [offersData, setOffersData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch real analytics data from API
  useEffect(() => {
    if (!store) return;
    setAnalyticsLoading(true);
    Promise.all([
      api.getAnalyticsChart(dateRange).catch(() => null),
      api.getAnalyticsOffers(dateRange).catch(() => null),
    ]).then(([chart, offers]) => {
      setChartData(chart);
      setOffersData(offers);
    }).finally(() => setAnalyticsLoading(false));
  }, [store, dateRange]);

  // CSV export
  function handleExportCSV() {
    if (!offersData?.offers) return;
    const rows = [['Offer Name', 'Type', 'Status', 'Triggered', 'Accepted', 'Declined', 'Accept Rate', 'Revenue']];
    offersData.offers.forEach(o => {
      const rate = o.total_triggered > 0 ? ((o.total_accepted / o.total_triggered) * 100).toFixed(1) : '0.0';
      rows.push([o.name, o.offer_type, o.status, o.total_triggered, o.total_accepted, o.total_declined, rate + '%', '$' + o.revenue_lifted.toFixed(2)]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `revenuepulse-analytics-${dateRange}d.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!store) {
    return (
      <div className="empty-state">
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Connect Your Store</h3>
        <p style={{ color: '#71717a' }}>Connect your Shopify store to view analytics.</p>
      </div>
    );
  }

  // Determine if we have funnel data (mock: always has funnel for now)
  const hasFunnel = mockFunnel && mockFunnel.nodes && mockFunnel.nodes.length > 0;

  // Compute aggregate stats — prefer real API data when available
  const realOffers = offersData?.offers || [];
  const realImpressions = realOffers.reduce((s, o) => s + (o.total_triggered || 0), 0);
  const realAccepts = realOffers.reduce((s, o) => s + (o.total_accepted || 0), 0);
  const realDeclines = realOffers.reduce((s, o) => s + (o.total_declined || 0), 0);
  const realRevenue = realOffers.reduce((s, o) => s + (o.revenue_lifted || 0), 0);
  const hasRealData = realImpressions > 0 || realRevenue > 0;

  const impressions = hasRealData ? realImpressions : mockMetrics.impressions;
  const accepts = hasRealData ? realAccepts : mockMetrics.accepts;
  const declines = hasRealData ? realDeclines : mockMetrics.declines;
  const revenue = hasRealData ? realRevenue : mockMetrics.revenue;
  const acceptRate = impressions > 0 ? ((accepts / impressions) * 100).toFixed(1) : '0.0';
  const aovLift = mockMetrics.avgOrderValue > 0 && mockMetrics.baselineAOV > 0
    ? (((mockMetrics.avgOrderValue / mockMetrics.baselineAOV) - 1) * 100).toFixed(1)
    : '0.0';

  // Accept rate color
  const rateNum = parseFloat(acceptRate);
  const rateColor = rateNum > 15 ? '#22c55e' : rateNum > 5 ? '#f59e0b' : '#ef4444';

  // AOV Lift color
  const aovLiftNum = parseFloat(aovLift);
  const aovColor = aovLiftNum >= 0 ? '#22c55e' : '#ef4444';

  function handleNodeClick(nodeId) {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
    // Scroll to table row
    if (tableRef.current) {
      const row = document.getElementById(`node-row-${nodeId}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  return (
    <div className="analytics">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">{store?.shop} — Upsell funnel performance</p>
        </div>
        <div className="analytics-header-actions">
          <button
            className="btn-export"
            onClick={handleExportCSV}
            disabled={analyticsLoading || !offersData?.offers?.length}
            title="Export offer performance to CSV"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <div className="date-range-toggle">
            <button className={`range-btn ${dateRange === '7' ? 'active' : ''}`} onClick={() => setDateRange('7')}>Last 7 days</button>
            <button className={`range-btn ${dateRange === '30' ? 'active' : ''}`} onClick={() => setDateRange('30')}>Last 30 days</button>
            <button className={`range-btn ${dateRange === '90' ? 'active' : ''}`} onClick={() => setDateRange('90')}>Last 90 days</button>
          </div>
        </div>
      </div>

      {!hasFunnel ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats row */}
          <div className="stats-row">
            <StatCard
              icon={<EyeIcon />}
              label="Impressions"
              value={impressions.toLocaleString()}
              sublabel="Total customers reached"
            />
            <StatCard
              icon={<CheckIcon />}
              label="Accept Rate"
              value={`${acceptRate}%`}
              sublabel={`${accepts.toLocaleString()} accepted`}
              valueColor={rateColor}
              subColor={rateColor}
            />
            <StatCard
              icon={<DollarIcon />}
              label="Revenue"
              value={`$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sublabel="From accepted offers"
            />
            <StatCard
              icon={<TrendingUpIcon />}
              label="AOV Lift"
              value={`+${aovLift}%`}
              sublabel={`vs $${mockMetrics.baselineAOV.toFixed(2)} baseline`}
              valueColor={aovColor}
              subColor={aovColor}
            />
          </div>

          {/* Funnel Visualization */}
          <div className="section">
            <div className="section-title">Funnel Visualization</div>
            <div className="funnel-graph-card">
              <FunnelGraph
                funnel={mockFunnel}
                metrics={mockMetrics}
                selectedNodeId={selectedNodeId}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>

          {/* Per-Node Metrics Table */}
          <div className="section">
            <div className="section-title">Node Performance</div>
            <div className="metrics-card" ref={tableRef}>
              <MetricsTable funnel={mockFunnel} metrics={mockMetrics} />
            </div>
          </div>
        </>
      )}

      <style>{`
        .analytics { max-width: 1100px; }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .page-title { font-size: 28px; font-weight: 700; color: #fafafa; margin: 0 0 4px; }
        .page-subtitle { color: #71717a; font-size: 14px; margin: 0; }

        /* Date range toggle */
        .analytics-header-actions { display: flex; gap: 10px; align-items: center; }

        .btn-export {
          display: flex; align-items: center; gap: 6px;
          background: #18181b; border: 1px solid #27272a; color: #a1a1aa;
          padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .btn-export:hover { background: #27272a; color: #fafafa; }
        .btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

        .date-range-toggle {
          display: flex;
          gap: 4px;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 4px;
        }
        .range-btn {
          background: none;
          border: none;
          color: #71717a;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .range-btn:hover { color: #e5e5e5; }
        .range-btn.active { background: #8b5cf6; color: #fff; }

        /* Stats row */
        .stats-row {
          display: flex;
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          flex: 1;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .stat-icon {
          color: #71717a;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .stat-content { flex: 1; }
        .stat-label {
          font-size: 11px;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .stat-value {
          font-size: 26px;
          font-weight: 700;
          color: #fafafa;
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-sub { font-size: 12px; color: #52525b; }

        /* Sections */
        .section { margin-bottom: 24px; }
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 12px;
        }

        /* Funnel graph */
        .funnel-graph-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 20px;
          overflow-x: auto;
        }
        .funnel-graph-wrap { min-width: 520px; }
        .funnel-graph-svg { display: block; }

        .funnel-node-group { transition: opacity 0.15s; }
        .funnel-node-group:hover { opacity: 0.85; }
        .funnel-node-group.selected rect:first-child { stroke: #8b5cf6; stroke-width: 2; }

        /* Metrics card */
        .metrics-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }

        /* Metrics table */
        .metrics-table-wrap { overflow-x: auto; }
        .metrics-table {
          width: 100%;
          border-collapse: collapse;
        }
        .metrics-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #27272a;
          border-bottom: 1px solid #27272a;
        }
        .metrics-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: #fafafa;
          border-bottom: 1px solid #27272a;
        }
        .metrics-table tr:last-child td { border-bottom: none; }
        .metrics-table tr:hover td { background: rgba(255,255,255,0.02); }
        .metrics-table tr.highlighted td { background: rgba(139,92,246,0.08); }

        .node-num { color: #71717a; font-weight: 600; }
        .node-product .product-name { font-weight: 500; color: #e5e5e5; }
        .node-impressions { font-variant-numeric: tabular-nums; }
        .node-revenue { color: #22c55e; font-weight: 600; font-variant-numeric: tabular-nums; }

        .pct-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .pct-badge.accept { background: rgba(34,197,94,0.15); color: #22c55e; }
        .pct-badge.decline { background: rgba(239,68,68,0.15); color: #ef4444; }

        .aov-lift-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .aov-lift-badge.positive { background: rgba(34,197,94,0.15); color: #22c55e; }
        .aov-lift-badge.negative { background: rgba(239,68,68,0.15); color: #ef4444; }
        .muted-dash { color: #3f3f46; }

        /* Empty state */
        .empty-state-analytics {
          text-align: center;
          padding: 80px 40px;
          color: #71717a;
        }
        .empty-state-analytics h3 {
          font-size: 16px;
          font-weight: 600;
          color: #a1a1aa;
          margin: 16px 0 8px;
        }
        .empty-state-analytics p { font-size: 14px; color: #52525b; margin: 0; }
        .empty-state-analytics strong { color: #a78bfa; }

        @media (max-width: 800px) {
          .stats-row { flex-wrap: wrap; gap: 12px; }
          .stat-card { min-width: calc(50% - 6px); }
          .page-header { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
        @media (max-width: 500px) {
          .stat-card { min-width: 100%; }
        }
      `}</style>
    </div>
  );
}