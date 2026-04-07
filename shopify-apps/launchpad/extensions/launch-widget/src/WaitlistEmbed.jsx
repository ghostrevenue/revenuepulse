import React, { useState } from 'react';

export function WaitlistEmbed({ campaignId, onSuccess }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState(null);
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const params = new URLSearchParams({ campaignId, email });
      if (referralCode) params.set('referredBy', referralCode);

      const res = await fetch(`/api/campaigns/${campaignId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, referredBy: referralCode })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setPosition(data.subscriber?.position);
        if (data.referralCode) {
          setReferralCode(data.referralCode);
        }
        if (onSuccess) onSuccess(data);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="lp-waitlist-success" style={styles.container}>
        <div style={styles.successIcon}>🎉</div>
        <h3 style={styles.title}>You're on the list!</h3>
        {position && <p style={styles.position}>Your position: <strong>#{position}</strong></p>}
        <p style={styles.message}>We'll notify you when this product launches.</p>
        {referralCode && (
          <div style={styles.referralBox}>
            <p style={styles.referralLabel}>Share to move up:</p>
            <code style={styles.code}>{referralCode}</code>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lp-waitlist-embed" style={styles.container}>
      <h3 style={styles.title}>Join the Waitlist</h3>
      <p style={styles.subtitle}>Be the first to know when we launch!</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          style={styles.input}
          required
          disabled={status === 'loading'}
        />
        <button type="submit" style={styles.button} disabled={status === 'loading'}>
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>
      {status === 'error' && <p style={styles.error}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    background: '#1a1a1a',
    borderRadius: '8px',
    textAlign: 'center',
    maxWidth: '400px',
    margin: '0 auto'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    padding: '12px 16px',
    background: '#222',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px'
  },
  button: {
    padding: '12px 16px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  error: {
    marginTop: '12px',
    color: '#ef4444',
    fontSize: '13px'
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  position: {
    fontSize: '16px',
    color: '#22c55e',
    marginBottom: '8px'
  },
  message: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  referralBox: {
    marginTop: '16px',
    padding: '12px',
    background: '#222',
    borderRadius: '6px'
  },
  referralLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '8px'
  },
  code: {
    display: 'block',
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#22c55e',
    wordBreak: 'break-all'
  }
};
