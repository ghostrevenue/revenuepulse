import React from 'react';

export function SubscriptionWidget({ product, variants }) {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedVariant, setSelectedVariant] = React.useState(null);
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [quantity, setQuantity] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  const plans = [
    { id: 1, name: 'Weekly', frequency_days: 7, discount_percent: 10 },
    { id: 2, name: 'Biweekly', frequency_days: 14, discount_percent: 10 },
    { id: 3, name: 'Monthly', frequency_days: 30, discount_percent: 10 },
    { id: 4, name: 'Quarterly', frequency_days: 90, discount_percent: 15 },
  ];

  const maxDiscount = Math.max(...plans.map(p => p.discount_percent));

  const handleSubscribe = async () => {
    if (!selectedVariant || !selectedPlan) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: window.customerId,
          store_id: window.storeId,
          product_id: product.id,
          variant_id: selectedVariant.id,
          quantity,
          frequency_days: selectedPlan.frequency_days,
          discount_percent: selectedPlan.discount_percent,
          status: 'active'
        })
      });
      
      if (response.ok) {
        alert('Subscription created successfully!');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '16px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>Subscribe & Save {maxDiscount}%</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>Get regular deliveries with exclusive discounts</div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#fff',
            color: '#6366f1',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Subscribe Now
        </button>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#1a1a1f',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 }}>Subscribe & Save</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Select Frequency</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    style={{
                      padding: '12px',
                      background: selectedPlan?.id === plan.id ? 'rgba(99, 102, 241, 0.2)' : '#0f0f12',
                      border: selectedPlan?.id === plan.id ? '2px solid #6366f1' : '2px solid #252530',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: '600' }}>{plan.name}</div>
                    <div style={{ color: '#34d399', fontSize: '13px' }}>Save {plan.discount_percent}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Quantity</label>
              <select
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f0f12',
                  border: '1px solid #252530',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {selectedPlan && (
              <div style={{
                background: '#0f0f12',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#9ca3af' }}>Every</span>
                  <span style={{ color: '#fff' }}>{selectedPlan.frequency_days} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#9ca3af' }}>Discount</span>
                  <span style={{ color: '#34d399' }}>{selectedPlan.discount_percent}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>You save</span>
                  <span style={{ color: '#34d399', fontWeight: '600' }}>
                    ${((product.price * quantity) * (selectedPlan.discount_percent / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={!selectedPlan || loading}
              style={{
                width: '100%',
                padding: '14px',
                background: selectedPlan ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#252530',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: selectedPlan ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating...' : 'Start Subscription'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: '16px' }}>
              Cancel or pause anytime from your account
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default SubscriptionWidget;
