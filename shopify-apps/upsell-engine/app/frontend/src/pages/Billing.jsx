import React, { useState } from 'react';

const Billing = () => {
  const [currentPlan] = useState('growth');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      description: 'Perfect for small stores just getting started',
      features: [
        '1 active offer',
        '100 orders/month',
        'Basic analytics',
        'Email support',
      ],
      limits: '100 orders/mo',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 49,
      description: 'For growing stores ready to scale',
      features: [
        'Unlimited offers',
        '1,000 orders/month',
        'A/B testing',
        'Full analytics',
        'Priority support',
      ],
      limits: '847/1,000 orders',
      featured: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      description: 'Maximum power for high-volume stores',
      features: [
        'Unlimited offers',
        'Unlimited orders',
        'AI product matching',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
      ],
      limits: 'Unlimited',
    },
  ];

  const handleUpgrade = (planId) => {
    console.log('Upgrading to:', planId);
  };

  const handleDowngrade = (planId) => {
    if (confirm('Are you sure you want to downgrade? You may lose access to some features.')) {
      console.log('Downgrading to:', planId);
    }
  };

  const currentPlanData = plans.find(p => p.id === currentPlan);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Billing</h1>
        <p className="page-subtitle">Manage your subscription and plan details</p>
      </div>

      {/* Trial Notice */}
      <div className="trial-notice">
        <div className="trial-notice-icon">🎁</div>
        <div className="trial-notice-text">
          <div className="trial-notice-title">14-Day Free Trial Active</div>
          <div className="trial-notice-desc">Your trial ends in 12 days. Upgrade anytime to continue using premium features.</div>
        </div>
        <button className="btn btn-success" style={{ background: 'white', color: '#5C6AC4' }}>
          Upgrade Now
        </button>
      </div>

      {/* Current Plan */}
      <div className="settings-card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
          Current Plan
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#5C6AC4' }}>
                {currentPlanData.name} Plan
              </span>
              <span className="billing-current">Current Plan</span>
            </div>
            <div style={{ fontSize: '14px', color: '#6D7175' }}>
              ${currentPlanData.price}/month • {currentPlanData.limits}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={`date-range-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
              style={{ background: billingCycle === 'monthly' ? '#5C6AC4' : 'white', color: billingCycle === 'monthly' ? 'white' : '#202223' }}
            >
              Monthly
            </button>
            <button
              className={`date-range-btn ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
              style={{ background: billingCycle === 'annual' ? '#5C6AC4' : 'white', color: billingCycle === 'annual' ? 'white' : '#202223' }}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div style={{ margin: '24px 0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Compare Plans</h3>
        <div className="billing-plans-grid">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`billing-card ${plan.featured ? 'featured' : ''}`}
            >
              {plan.featured && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#5C6AC4', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                  Most Popular
                </div>
              )}
              <div className="billing-plan-name">{plan.name}</div>
              <div className="billing-plan-price">
                ${billingCycle === 'annual' ? Math.round(plan.price * 0.8) : plan.price}
                <span>/month</span>
              </div>
              <p style={{ fontSize: '13px', color: '#6D7175', marginTop: '8px' }}>{plan.description}</p>
              <ul className="billing-plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.id === currentPlan ? (
                <button className="btn btn-secondary" disabled style={{ width: '100%' }}>
                  Current Plan
                </button>
              ) : plan.price > currentPlanData.price ? (
                <button className="btn btn-success" style={{ width: '100%' }} onClick={() => handleUpgrade(plan.id)}>
                  Upgrade to {plan.name}
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleDowngrade(plan.id)}>
                  Downgrade to {plan.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="settings-card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
          Usage This Month
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: '#F6F6F7', borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#5C6AC4' }}>847</div>
            <div style={{ fontSize: '13px', color: '#6D7175', marginTop: '4px' }}>Orders Processed</div>
            <div style={{ fontSize: '12px', color: '#008060', marginTop: '8px' }}>85% of limit</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#F6F6F7', borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#008060' }}>$15,420</div>
            <div style={{ fontSize: '13px', color: '#6D7175', marginTop: '4px' }}>Revenue Generated</div>
            <div style={{ fontSize: '12px', color: '#008060', marginTop: '8px' }}>↑ 12% from last month</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: '#F6F6F7', borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F49342' }}>12</div>
            <div style={{ fontSize: '13px', color: '#6D7175', marginTop: '4px' }}>Active Offers</div>
            <div style={{ fontSize: '12px', color: '#6D7175', marginTop: '8px' }}>Unlimited on Growth</div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="settings-card">
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
          Payment Method
        </h3>
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '32px', background: '#1A1A2E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '700' }}>
              VISA
            </div>
            <div>
              <div style={{ fontWeight: '500' }}>Visa ending in 4242</div>
              <div style={{ fontSize: '12px', color: '#6D7175' }}>Expires 12/2025</div>
            </div>
          </div>
          <button className="btn btn-sm btn-secondary">
            Update
          </button>
        </div>
        <div style={{ marginTop: '16px', padding: '12px', background: '#F6F6F7', borderRadius: '8px', fontSize: '13px', color: '#6D7175' }}>
          Next billing date: April 15, 2024 • $49.00
        </div>
      </div>
    </div>
  );
};

export default Billing;
