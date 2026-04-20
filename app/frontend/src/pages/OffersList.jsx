import React, { useState, useEffect } from 'react';
import { api } from '../api/index.js';
import OfferBuilder from './OfferBuilder.jsx';

export default function OffersList({ store, appConfig }) {
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeFunnel, setActiveFunnel] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (store) loadFunnels();
  }, [store]);

  async function loadFunnels() {
    try {
      const data = await api.getFunnels();
      setFunnels(data.funnels || []);
    } catch (e) {
      console.error('Failed to load funnels:', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(updated) {
    try {
      let result;
      if (updated.id) {
        result = await api.updateFunnel(updated.id, updated);
        setActiveFunnel(result.funnel || result);
      } else {
        result = await api.createFunnel(updated);
        setActiveFunnel(result.funnel || result);
      }
      // Reload funnels list after save
      await loadFunnels();
    } catch (e) {
      console.error('Failed to save funnel:', e.message);
    }
  }

  function handleDone() {
    // Done in OfferBuilder: return to list (changes already saved by Done button)
    setShowBuilder(false);
    setActiveFunnel(null);
    loadFunnels();
  }

  async function handleDelete(funnelId) {
    if (!confirm('Delete this funnel? This cannot be undone.')) return;
    setDeletingId(funnelId);
    setDeleteError(null);
    try {
      await api.deleteFunnel(funnelId);
      await loadFunnels();
      if (activeFunnel?.id === funnelId) {
        setShowBuilder(false);
        setActiveFunnel(null);
      }
    } catch (e) {
      setDeleteError('Failed to delete: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleStatus(funnel) {
    const newStatus = funnel.status === 'active' ? 'draft' : 'active';
    try {
      await api.updateFunnel(funnel.id, { ...funnel, status: newStatus });
      await loadFunnels();
    } catch (e) {
      console.error('Failed to update funnel status:', e.message);
    }
  }

  function startCreate() {
    setActiveFunnel({ id: null, name: 'Untitled Funnel', status: 'draft', trigger: { conditions: [], match: 'all' }, nodes: [] });
    setShowBuilder(true);
  }

  function startEdit(funnel) {
    setActiveFunnel(funnel);
    setShowBuilder(true);
  }

  function goBack() {
    setShowBuilder(false);
    setActiveFunnel(null);
    loadFunnels();
  }

  // ── Builder view ──────────────────────────────────────────────────────────────
  if (showBuilder && activeFunnel !== null) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 0', borderBottom: '1px solid #27272a', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={goBack}
            style={{ background: 'none', border: '1px solid #27272a', color: '#a1a1aa', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Offers
          </button>
          <span style={{ color: '#52525b', fontSize: '14px' }}>
            {activeFunnel.id ? 'Editing funnel' : 'Creating new funnel'}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <OfferBuilder
            funnel={activeFunnel}
            onSave={handleSave}
            onClose={handleDone}
          />
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  if (!store) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '56px', height: '56px', margin: '0 auto 16px', display: 'block', opacity: 0.4 }}>
          <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Connect Your Store</h3>
        <p style={{ color: '#71717a', marginBottom: '16px' }}>Install PostPurchasePro in your Shopify store to manage upsell funnels.</p>
        <p style={{ fontSize: '12px', color: '#52525b' }}>
          API Key: {appConfig?.apiKey ? '✓ ' + appConfig.apiKey.substring(0, 8) + '...' : '✗ Not set'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#71717a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid #27272a', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <span>Loading offers...</span>
        </div>
      </div>
    );
  }

  const activeFunnels = funnels.filter(f => f.status === 'active');
  const draftFunnels = funnels.filter(f => f.status !== 'active');

  return (
    <div className="offers-list-page" style={{ maxWidth: '1000px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fafafa', margin: '0 0 4px' }}>Post-Purchase Upsells</h1>
          <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>Build and manage your funnel sequences</p>
        </div>
        <button className="btn-primary" onClick={startCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Funnel
        </button>
      </div>

      {deleteError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px' }}>
          {deleteError}
          <button onClick={() => setDeleteError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}

      {funnels.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '60px 40px', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" style={{ width: '56px', height: '56px', margin: '0 auto 16px', display: 'block' }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', margin: '0 0 8px' }}>No funnels yet</h2>
          <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '20px' }}>Create your first upsell funnel to start boosting revenue.</p>
          <button className="btn-primary" onClick={startCreate} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Create Your First Funnel
          </button>
        </div>
      ) : (
        <>
          {/* Active Funnels */}
          {activeFunnels.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Active ({activeFunnels.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeFunnels.map(funnel => (
                  <FunnelCard
                    key={funnel.id}
                    funnel={funnel}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggleStatus}
                    deleting={deletingId === funnel.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Draft Funnels */}
          {draftFunnels.length > 0 && (
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Drafts ({draftFunnels.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {draftFunnels.map(funnel => (
                  <FunnelCard
                    key={funnel.id}
                    funnel={funnel}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggleStatus}
                    deleting={deletingId === funnel.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FunnelCard({ funnel, onEdit, onDelete, onToggle, deleting }) {
  const nodeCount = funnel.nodes?.length || 0;
  const trigger = funnel.trigger;
  const hasConditions = trigger?.conditions?.length > 0;

  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Status indicator */}
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: funnel.status === 'active' ? '#22c55e' : '#52525b', flexShrink: 0, marginTop: '2px' }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>{funnel.name || 'Untitled Funnel'}</span>
          {funnel.status === 'active' && (
            <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '1px 8px', borderRadius: '9999px', fontWeight: 700 }}>LIVE</span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: '#71717a' }}>
          {nodeCount === 0 ? 'No steps yet' : `${nodeCount} step${nodeCount !== 1 ? 's' : ''}`}
          {hasConditions && ' · Has trigger conditions'}
        </div>
      </div>

      {/* Toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', color: funnel.status === 'active' ? '#22c55e' : '#52525b' }}>
          {funnel.status === 'active' ? 'Active' : 'Draft'}
        </span>
        <div style={{ position: 'relative', width: '38px', height: '22px' }}>
          <input
            type="checkbox"
            checked={funnel.status === 'active'}
            onChange={() => onToggle(funnel)}
            disabled={deleting}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: funnel.status === 'active' ? '#8b5cf6' : '#3f3f46', borderRadius: '22px', transition: '0.2s', cursor: deleting ? 'not-allowed' : 'pointer' }} />
          <div style={{ position: 'absolute', top: '3px', left: funnel.status === 'active' ? '21px' : '3px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s' }} />
        </div>
      </label>

      {/* Edit */}
      <button
        onClick={() => onEdit(funnel)}
        disabled={deleting}
        style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', padding: '7px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseOver={e => { e.currentTarget.style.background = '#3f3f46'; e.currentTarget.style.color = '#fafafa'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#a1a1aa'; }}
      >
        Edit
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(funnel.id)}
        disabled={deleting}
        style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '7px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}
        title="Delete funnel"
      >
        {deleting ? '...' : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        )}
      </button>
    </div>
  );
}
