import React from 'react';

export function ManageSubscription({ subscription, customerId }) {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(null);

  const handlePause = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/pause`, { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription paused successfully!' });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to pause subscription' });
    }
    setLoading(false);
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/resume`, { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription resumed successfully!' });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resume subscription' });
    }
    setLoading(false);
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/skip`, { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Next delivery skipped!' });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to skip delivery' });
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/cancel`, { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Subscription cancelled.' });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    }
    setLoading(false);
  };

  const frequencyLabels = {
    7: 'Every week',
    14: 'Every 2 weeks',
    30: 'Every month',
    60: 'Every 2 months',
    90: 'Every 3 months'
  };

  return (
    <div style={{
      background: '#1a1a1f',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>
        Your Subscription
      </h3>

      {message && (
        <div style={{
          padding: '12px',
          background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#9ca3af' }}>Status</span>
          <span className={`badge ${subscription.status}`}>{subscription.status}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#9ca3af' }}>Frequency</span>
          <span style={{ color: '#fff' }}>{frequencyLabels[subscription.frequency_days] || `Every ${subscription.frequency_days} days`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#9ca3af' }}>Quantity</span>
          <span style={{ color: '#fff' }}>{subscription.quantity}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#9ca3af' }}>Your discount</span>
          <span style={{ color: '#34d399' }}>{subscription.discount_percent}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9ca3af' }}>Next delivery</span>
          <span style={{ color: '#fff' }}>
            {subscription.next_billing_date 
              ? new Date(subscription.next_billing_date).toLocaleDateString()
              : 'N/A'
            }
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subscription.status === 'active' && (
          <>
            <button
              onClick={handleSkip}
              disabled={loading}
              style={{
                padding: '12px',
                background: '#252530',
                color: '#e8e9eb',
                border: '1px solid #3a3a42',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Skip Next Delivery
            </button>
            <button
              onClick={handlePause}
              disabled={loading}
              style={{
                padding: '12px',
                background: '#252530',
                color: '#fbbf24',
                border: '1px solid #3a3a42',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Pause Subscription
            </button>
          </>
        )}
        
        {subscription.status === 'paused' && (
          <button
            onClick={handleResume}
            disabled={loading}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Resume Subscription
          </button>
        )}

        {subscription.status !== 'cancelled' && (
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              padding: '12px',
              background: 'rgba(248, 113, 113, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel Subscription
          </button>
        )}
      </div>
    </div>
  );
}

export default ManageSubscription;
