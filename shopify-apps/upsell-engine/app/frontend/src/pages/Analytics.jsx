import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import FunnelChart from '../components/FunnelChart';
import BarChart from '../components/BarChart';
import { analyticsApi } from '../api/analytics';

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

const CartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </svg>
);

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      border: '3px solid #f3f3f3', 
      borderTop: '3px solid #5C6AC4', 
      borderRadius: '50%', 
      animation: 'spin 1s linear infinite' 
    }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const Analytics = () => {
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [stats, setStats] = useState({
    revenue: 0,
    revenueTrend: 0,
    conversionRate: 0,
    conversionTrend: 0,
    aovLift: 0,
    aovTrend: 0,
    totalOrders: 0,
    ordersTrend: 0,
  });
  const [funnelData, setFunnelData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topOffers, setTopOffers] = useState([]);
  const [perfSummary, setPerfSummary] = useState({
    totalOffersShown: 0,
    totalClicks: 0,
    avgOrderIncrease: 0,
    revenuePerOrder: 0,
  });

  // Calculate date range based on selection
  const getDateRangeParams = useCallback((days) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate, endDate };
  }, []);

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const days = dateRange === 'custom' ? 30 : parseInt(dateRange);
      const { startDate, endDate } = getDateRangeParams(days);
      
      // Fetch all data in parallel
      const [summaryData, revenueResponse, funnelResponse, topOffersResponse] = await Promise.all([
        analyticsApi.getByDateRange(startDate, endDate).catch(() => ({ metrics: {}, revenue: [], topOffers: [], funnel: [] })),
        analyticsApi.getRevenueData(`${days}d`).catch(() => ({ revenue: [], totalRevenue: 0 })),
        analyticsApi.getFunnelData().catch(() => ({ funnel: [] })),
        analyticsApi.getTopOffers(10).catch(() => ({ topOffers: [] })),
      ]);

      const metrics = summaryData.metrics || {};
      
      // Get previous period for trend calculation
      const prevDays = days;
      const prevStartDate = new Date(Date.now() - (days + prevDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const prevEndDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let prevMetrics = { totalRevenue: 0, conversions: 0, conversionRate: 0 };
      try {
        const prevData = await analyticsApi.getByDateRange(prevStartDate, prevEndDate);
        prevMetrics = prevData.metrics || prevMetrics;
      } catch {
        // Previous period not critical
      }

      // Calculate trends
      const revenueTrend = prevMetrics.totalRevenue > 0 
        ? ((metrics.totalRevenue - prevMetrics.totalRevenue) / prevMetrics.totalRevenue * 100) 
        : 0;
      const conversionTrend = prevMetrics.conversionRate > 0 
        ? (metrics.conversionRate - prevMetrics.conversionRate) 
        : 0;
      const ordersTrend = prevMetrics.conversions > 0 
        ? ((metrics.conversions - prevMetrics.conversions) / prevMetrics.conversions * 100) 
        : 0;

      // Calculate AOV lift (average order value increase)
      const aovLift = metrics.conversions > 0 
        ? (metrics.totalRevenue / metrics.conversions) 
        : 0;
      const prevAov = prevMetrics.conversions > 0 
        ? (prevMetrics.totalRevenue / prevMetrics.conversions) 
        : 0;
      const aovTrend = prevAov > 0 
        ? ((aovLift - prevAov) / prevAov * 100) 
        : 0;

      // Update stats
      setStats({
        revenue: metrics.totalRevenue || 0,
        revenueTrend: Math.round(revenueTrend * 10) / 10,
        conversionRate: metrics.conversionRate || 0,
        conversionTrend: Math.round(conversionTrend * 10) / 10,
        aovLift: Math.round(aovLift * 100) / 100,
        aovTrend: Math.round(aovTrend * 10) / 10,
        totalOrders: metrics.conversions || 0,
        ordersTrend: Math.round(ordersTrend * 10) / 10,
      });

      // Process funnel data
      const funnel = summaryData.funnel || funnelResponse.funnel || [];
      if (funnel.length > 0) {
        const totalShown = funnel.reduce((sum, d) => sum + (d.shown || d.impressions || 0), 0);
        const totalClicked = funnel.reduce((sum, d) => sum + (d.clicked || 0), 0);
        const totalConverted = funnel.reduce((sum, d) => sum + (d.converted || 0), 0);
        setFunnelData([
          { stage: 'Offered', value: totalShown, percentage: 100, color: 'offered' },
          { stage: 'Clicked', value: totalClicked, percentage: totalShown > 0 ? Math.round((totalClicked / totalShown) * 100) : 0, color: 'clicked' },
          { stage: 'Purchased', value: totalConverted, percentage: totalShown > 0 ? Math.round((totalConverted / totalShown) * 100) : 0, color: 'purchased' },
        ]);
      } else {
        setFunnelData([
          { stage: 'Offered', value: 0, percentage: 100, color: 'offered' },
          { stage: 'Clicked', value: 0, percentage: 0, color: 'clicked' },
          { stage: 'Purchased', value: 0, percentage: 0, color: 'purchased' },
        ]);
      }

      // Process revenue data for chart
      const revenue = summaryData.revenue || revenueResponse.revenue || [];
      if (revenue.length > 0) {
        setRevenueData(revenue.map(day => ({
          label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: day.revenue || day.daily_revenue || 0,
        })));
      } else {
        setRevenueData([]);
      }

      // Process top offers
      const offers = summaryData.topOffers || topOffersResponse.topOffers || [];
      setTopOffers(offers.map((offer, index) => ({
        id: offer.id || index,
        name: offer.name || 'Unknown Offer',
        conversions: offer.conversions || 0,
        revenue: offer.revenue || 0,
        cr: `${(offer.conversionRate || offer.conversionFromClick || 0).toFixed(1)}%`,
      })));

      // Update performance summary
      const impressions = metrics.impressions || 0;
      const clicks = metrics.clicks || 0;
      setPerfSummary({
        totalOffersShown: impressions,
        totalClicks: clicks,
        avgOrderIncrease: aovLift,
        revenuePerOrder: metrics.conversions > 0 ? metrics.totalRevenue / metrics.conversions : 0,
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, getDateRangeParams]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Track your upsell performance and revenue</p>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Track your upsell performance and revenue</p>
          </div>
        </div>
        <div className="error-message" style={{ 
          padding: '20px', 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px',
          color: '#c00',
          marginTop: '20px'
        }}>
          {error}
          <button 
            onClick={fetchAnalytics}
            style={{ 
              marginLeft: '16px', 
              padding: '8px 16px', 
              background: '#5C6AC4', 
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasData = stats.revenue > 0 || stats.totalOrders > 0 || revenueData.length > 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your upsell performance and revenue</p>
        </div>
        <div className="date-range-picker" style={{ margin: 0 }}>
          <button
            className={`date-range-btn ${dateRange === '7' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('7')}
          >
            Last 7 days
          </button>
          <button
            className={`date-range-btn ${dateRange === '30' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('30')}
          >
            Last 30 days
          </button>
          <button
            className={`date-range-btn ${dateRange === '90' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('90')}
          >
            Last 90 days
          </button>
          <button
            className={`date-range-btn ${dateRange === 'custom' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('custom')}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <StatCard
          icon={<RevenueIcon />}
          iconClass="purple"
          value={`$${stats.revenue.toLocaleString()}`}
          label="Revenue Generated"
          trend={`${stats.revenueTrend >= 0 ? '+' : ''}${stats.revenueTrend}%`}
          trendDirection={stats.revenueTrend >= 0 ? "up" : "down"}
        />
        <StatCard
          icon={<PercentIcon />}
          iconClass="green"
          value={`${stats.conversionRate}%`}
          label="Upsell Conversion %"
          trend={`${stats.conversionTrend >= 0 ? '+' : ''}${stats.conversionTrend}%`}
          trendDirection={stats.conversionTrend >= 0 ? "up" : "down"}
        />
        <StatCard
          icon={<TrendIcon />}
          iconClass="orange"
          value={`$${stats.aovLift.toFixed(2)}`}
          label="Avg. Order Increase"
          trend={`${stats.aovTrend >= 0 ? '+' : ''}${stats.aovTrend}%`}
          trendDirection={stats.aovTrend >= 0 ? "up" : "down"}
        />
        <StatCard
          icon={<CartIcon />}
          iconClass="blue"
          value={stats.totalOrders.toLocaleString()}
          label="Total Orders"
          trend={`${stats.ordersTrend >= 0 ? '+' : ''}${stats.ordersTrend}%`}
          trendDirection={stats.ordersTrend >= 0 ? "up" : "down"}
        />
      </div>

      <div className="two-col-grid">
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-title">Conversion Funnel</div>
            <div className="chart-legend">
              <div className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: '#5C6AC4' }}></div>
                Offered
              </div>
              <div className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: '#8A94C7' }}></div>
                Clicked
              </div>
              <div className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: '#008060' }}></div>
                Purchased
              </div>
            </div>
          </div>
          <FunnelChart data={funnelData} />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-title">Revenue Over Time</div>
            <div className="chart-legend">
              <div className="chart-legend-item">
                <div className="chart-legend-dot" style={{ background: '#5C6AC4' }}></div>
                Daily Revenue
              </div>
            </div>
          </div>
          {revenueData.length > 0 ? (
            <BarChart data={revenueData} height={200} />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '200px',
              color: '#6D7175'
            }}>
              No revenue data available yet
            </div>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title">Top Performing Offers</div>
        </div>
        {topOffers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Offer Name</th>
                <th>Conversions</th>
                <th>Revenue</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {topOffers.map((offer, index) => (
                <tr key={offer.id}>
                  <td>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: index < 3 ? 'rgba(92, 106, 196, 0.1)' : '#F6F6F7',
                      color: index < 3 ? '#5C6AC4' : '#6D7175',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}>
                      {index + 1}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{offer.name}</td>
                  <td>{offer.conversions.toLocaleString()}</td>
                  <td>${offer.revenue.toLocaleString()}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#008060',
                      fontWeight: '500',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15"/>
                      </svg>
                      {offer.cr}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#6D7175' 
          }}>
            No offer data available yet
          </div>
        )}
      </div>

      <div className="chart-container" style={{ marginTop: '24px' }}>
        <div className="chart-header">
          <div className="chart-title">Performance Summary</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', padding: '10px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#5C6AC4' }}>
              {hasData ? perfSummary.totalOffersShown.toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '13px', color: '#6D7175', marginTop: '4px' }}>Total Offers Shown</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#008060' }}>
              {hasData ? perfSummary.totalClicks.toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '13px', color: '#6D7175', marginTop: '4px' }}>Total Clicks</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F49342' }}>
              {hasData ? `$${perfSummary.avgOrderIncrease.toFixed(2)}` : '$0.00'}
            </div>
            <div style={{ fontSize: '13px', color: '#6D7175', marginTop: '4px' }}>Avg. Order Increase</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#5C6AC4' }}>
              {hasData ? `$${perfSummary.revenuePerOrder.toFixed(2)}` : '$0.00'}
            </div>
            <div style={{ fontSize: '13px', color: '#6D7175', marginTop: '4px' }}>Revenue Per Order</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
