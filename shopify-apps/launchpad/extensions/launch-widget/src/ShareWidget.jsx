import React, { useState } from 'react';

export function ShareWidget({ code, storeUrl }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = storeUrl ? `${storeUrl}?ref=${code}` : `?ref=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTwitter = () => {
    const text = encodeURIComponent("I just joined a product waitlist! Use my link to join and we both move up the list:");
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Join this product waitlist!");
    const body = encodeURIComponent(`Hey, I just joined a waitlist for an upcoming product. Use my referral link to join and we both move up the list:\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Move up the list! 🎁</h3>
      <p style={styles.description}>Share with friends — each signup moves you closer to the front!</p>
      
      <div style={styles.linkBox}>
        <code style={styles.code}>{shareUrl}</code>
        <button onClick={handleCopy} style={styles.copyBtn}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <div style={styles.shareButtons}>
        <button onClick={handleTwitter} style={styles.shareBtn} title="Share on Twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </button>
        <button onClick={handleFacebook} style={styles.shareBtn} title="Share on Facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </button>
        <button onClick={handleEmail} style={styles.shareBtn} title="Share via Email">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        </button>
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
    margin: '16px auto 0'
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '8px'
  },
  description: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '16px'
  },
  linkBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#222',
    borderRadius: '6px',
    padding: '8px 12px',
    marginBottom: '16px'
  },
  code: {
    flex: 1,
    fontSize: '12px',
    color: '#22c55e',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  copyBtn: {
    padding: '6px 12px',
    background: '#333',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer'
  },
  shareButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  shareBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#222',
    border: 'none',
    borderRadius: '8px',
    color: '#9ca3af',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
