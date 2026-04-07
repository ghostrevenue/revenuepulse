import React, { useState, useEffect } from 'react';

export function CountdownTimer({ launchDate, onLaunch }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (!launchDate) return;

    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(launchDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setLaunched(true);
        if (onLaunch) onLaunch();
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [launchDate, onLaunch]);

  if (launched) {
    return (
      <div style={styles.container}>
        <div style={styles.launched}>🎉 LAUNCHED!</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Launch Countdown</h3>
      <div style={styles.timer}>
        <div style={styles.unit}>
          <span style={styles.number}>{String(timeLeft.days).padStart(2, '0')}</span>
          <span style={styles.label}>Days</span>
        </div>
        <span style={styles.separator}>:</span>
        <div style={styles.unit}>
          <span style={styles.number}>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span style={styles.label}>Hours</span>
        </div>
        <span style={styles.separator}>:</span>
        <div style={styles.unit}>
          <span style={styles.number}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span style={styles.label}>Minutes</span>
        </div>
        <span style={styles.separator}>:</span>
        <div style={styles.unit}>
          <span style={styles.number}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span style={styles.label}>Seconds</span>
        </div>
      </div>
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
    margin: '0 auto 16px'
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  timer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px'
  },
  unit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  number: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace'
  },
  label: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: '4px'
  },
  separator: {
    fontSize: '24px',
    color: '#6b7280',
    fontWeight: '700',
    marginTop: '-16px'
  },
  launched: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#22c55e'
  }
};
