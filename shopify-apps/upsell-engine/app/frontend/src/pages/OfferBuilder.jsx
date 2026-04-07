// OfferBuilder - Visual Flow Builder for Upsell Offers
// Step-by-step flow: Targeting → Content → Accepted Offers → Declined Offers

import React, { useState, useEffect } from 'react';
import FlowStep from '../components/FlowStep';
import MultiSelect from '../components/MultiSelect';
import OfferEditor from '../components/OfferEditor';
import OfferCard from '../components/OfferCard';
import { offersApi } from '../api/offers';

const STEPS = [
  { 
    id: 1, 
    title: 'Targeting', 
    description: 'Define who sees this offer' 
  },
  { 
    id: 2, 
    title: 'Content', 
    description: 'Configure the main offer popup' 
  },
  { 
    id: 3, 
    title: 'Accepted Offer', 
    description: 'Upsells when customer accepts' 
  },
  { 
    id: 4, 
    title: 'Declined Offer', 
    description: 'Alternative path when declined' 
  },
];

const INITIAL_OFFER = {
  name: '',
  status: 'draft',
  targeting: {
    targetProducts: [],
    excludeProducts: [],
    targetCollections: [],
    excludeCollections: [],
    targetTags: [],
    excludeTags: [],
    minOrderValue: 0,
    maxOrderValue: 0,
    customerType: 'all',
  },
  content: {
    headline: 'You might also like...',
    subheadline: 'Complete your look with our premium accessories',
    badge: { text: '20% OFF', color: '#5C6AC4' },
    productId: '',
    productName: '',
    productImage: '',
    productPrice: 0,
    variantId: '',
    pricingType: 'percentage',
    pricingValue: 20,
    ctaText: 'Add to Cart',
    declineText: 'No thanks',
    timerEnabled: false,
    timerMinutes: 15,
    backgroundStyle: 'light',
  },
  acceptedOffers: [],
  declinedOffers: [],
};

const createEmptyOffer = (type) => ({
  id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  productId: '',
  productName: '',
  productImage: '',
  productPrice: 0,
  pricingType: 'percentage',
  pricingValue: 15,
  headline: type === 'accepted' ? 'Great choice!' : 'Maybe later...',
  subheadline: '',
  badgeText: type === 'accepted' ? 'ADD-ON' : 'EXCLUSIVE',
  badgeColor: type === 'accepted' ? '#008060' : '#F49342',
  ctaText: type === 'accepted' ? 'Add to Order' : 'Maybe Later',
  declineText: 'No thanks',
  enabled: true,
  timerEnabled: false,
  timerMinutes: 15,
  backgroundStyle: 'light',
});

const OfferBuilder = ({ offerId, onSave, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [offer, setOffer] = useState(INITIAL_OFFER);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing offer if editing
  useEffect(() => {
    if (offerId) {
      setIsLoading(true);
      offersApi.getById(offerId)
        .then(data => {
          if (data.offer) {
            // Transform backend data to frontend format
            const backendOffer = data.offer;
            setOffer({
              name: backendOffer.name || '',
              status: backendOffer.status || 'draft',
              targeting: {
                targetProducts: backendOffer.trigger_config?.targetProducts || [],
                excludeProducts: backendOffer.trigger_config?.excludeProducts || [],
                targetCollections: backendOffer.trigger_config?.targetCollections || [],
                excludeCollections: backendOffer.trigger_config?.excludeCollections || [],
                targetTags: backendOffer.trigger_config?.targetTags || [],
                excludeTags: backendOffer.trigger_config?.excludeTags || [],
                minOrderValue: backendOffer.trigger_config?.minOrderValue || 0,
                maxOrderValue: backendOffer.trigger_config?.maxOrderValue || 0,
                customerType: backendOffer.trigger_config?.customerType || 'all',
              },
              content: {
                headline: backendOffer.product_config?.headline || 'You might also like...',
                subheadline: backendOffer.product_config?.subheadline || '',
                badge: backendOffer.product_config?.badge || { text: '20% OFF', color: '#5C6AC4' },
                productId: backendOffer.product_config?.productId || '',
                productName: backendOffer.product_config?.productName || '',
                productImage: backendOffer.product_config?.productImage || '',
                productPrice: backendOffer.product_config?.productPrice || 0,
                variantId: backendOffer.product_config?.variantId || '',
                pricingType: backendOffer.product_config?.pricingType || 'percentage',
                pricingValue: backendOffer.product_config?.pricingValue || 20,
                ctaText: backendOffer.product_config?.ctaText || 'Add to Cart',
                declineText: backendOffer.product_config?.declineText || 'No thanks',
                timerEnabled: backendOffer.product_config?.timerEnabled || false,
                timerMinutes: backendOffer.product_config?.timerMinutes || 15,
                backgroundStyle: backendOffer.product_config?.backgroundStyle || 'light',
              },
              acceptedOffers: backendOffer.product_config?.acceptedOffers || [],
              declinedOffers: backendOffer.product_config?.declinedOffers || [],
            });
          }
        })
        .catch(err => console.error('Error loading offer:', err))
        .finally(() => setIsLoading(false));
    }
  }, [offerId]);

  const handleOfferChange = (updates) => {
    setOffer(prev => ({ ...prev, ...updates }));
  };

  const handleTargetingChange = (field, value) => {
    setOffer(prev => ({
      ...prev,
      targeting: { ...prev.targeting, [field]: value }
    }));
  };

  const handleContentChange = (updates) => {
    setOffer(prev => ({
      ...prev,
      content: { ...prev.content, ...updates }
    }));
  };

  const handleAddAcceptedOffer = () => {
    if (offer.acceptedOffers.length >= 6) return;
    setOffer(prev => ({
      ...prev,
      acceptedOffers: [...prev.acceptedOffers, createEmptyOffer('accepted')]
    }));
  };

  const handleAddDeclinedOffer = () => {
    if (offer.declinedOffers.length >= 6) return;
    setOffer(prev => ({
      ...prev,
      declinedOffers: [...prev.declinedOffers, createEmptyOffer('declined')]
    }));
  };

  const handleUpdateAcceptedOffer = (index, updatedOffer) => {
    setOffer(prev => ({
      ...prev,
      acceptedOffers: prev.acceptedOffers.map((o, i) => i === index ? updatedOffer : o)
    }));
  };

  const handleUpdateDeclinedOffer = (index, updatedOffer) => {
    setOffer(prev => ({
      ...prev,
      declinedOffers: prev.declinedOffers.map((o, i) => i === index ? updatedOffer : o)
    }));
  };

  const handleRemoveAcceptedOffer = (index) => {
    setOffer(prev => ({
      ...prev,
      acceptedOffers: prev.acceptedOffers.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveDeclinedOffer = (index) => {
    setOffer(prev => ({
      ...prev,
      declinedOffers: prev.declinedOffers.filter((_, i) => i !== index)
    }));
  };

  const handleMoveAcceptedOffer = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= offer.acceptedOffers.length) return;
    const newOffers = [...offer.acceptedOffers];
    [newOffers[index], newOffers[newIndex]] = [newOffers[newIndex], newOffers[index]];
    setOffer(prev => ({ ...prev, acceptedOffers: newOffers }));
  };

  const handleMoveDeclinedOffer = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= offer.declinedOffers.length) return;
    const newOffers = [...offer.declinedOffers];
    [newOffers[index], newOffers[newIndex]] = [newOffers[newIndex], newOffers[index]];
    setOffer(prev => ({ ...prev, declinedOffers: newOffers }));
  };

  const transformToBackend = () => {
    return {
      name: offer.name || 'Untitled Offer',
      description: '',
      status: offer.status,
      trigger_config: {
        targetProducts: offer.targeting.targetProducts,
        excludeProducts: offer.targeting.excludeProducts,
        targetCollections: offer.targeting.targetCollections,
        excludeCollections: offer.targeting.excludeCollections,
        targetTags: offer.targeting.targetTags,
        excludeTags: offer.targeting.excludeTags,
        minOrderValue: offer.targeting.minOrderValue,
        maxOrderValue: offer.targeting.maxOrderValue,
        customerType: offer.targeting.customerType,
      },
      product_config: {
        headline: offer.content.headline,
        subheadline: offer.content.subheadline,
        badge: offer.content.badge,
        productId: offer.content.productId,
        productName: offer.content.productName,
        productImage: offer.content.productImage,
        productPrice: offer.content.productPrice,
        variantId: offer.content.variantId,
        pricingType: offer.content.pricingType,
        pricingValue: offer.content.pricingValue,
        ctaText: offer.content.ctaText,
        declineText: offer.content.declineText,
        timerEnabled: offer.content.timerEnabled,
        timerMinutes: offer.content.timerMinutes,
        backgroundStyle: offer.content.backgroundStyle,
        acceptedOffers: offer.acceptedOffers,
        declinedOffers: offer.declinedOffers,
      },
      display_config: {},
      frequency_cap: {},
      schedule: {},
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const backendData = transformToBackend();
      if (offerId) {
        await offersApi.update(offerId, backendData);
      } else {
        await offersApi.create(backendData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving offer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepClick = (stepNumber) => {
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return offer.name.trim().length > 0;
      case 2:
        return offer.content.productId;
      default:
        return true;
    }
  };

  const goToNextStep = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="offer-builder-loading">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        Loading offer...
      </div>
    );
  }

  return (
    <div className="offer-builder">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{offerId ? 'Edit Offer' : 'Create New Offer'}</h1>
        <p className="page-subtitle">Build your upsell flow with our visual editor</p>
      </div>

      {/* Visual Flow Diagram */}
      <div className="flow-diagram">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`flow-diagram-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="flow-diagram-number">
                {currentStep > step.id ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : step.id}
              </div>
              <div className="flow-diagram-label">{step.title}</div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flow-diagram-connector ${currentStep > step.id ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Navigation */}
      <div className="step-navigation">
        {currentStep > 1 && (
          <button className="btn btn-secondary" onClick={goToPrevStep}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
        )}
        <div style={{ flex: 1 }} />
        {currentStep < 4 ? (
          <button 
            className="btn btn-primary" 
            onClick={goToNextStep}
            disabled={!canProceed()}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ) : (
          <button 
            className="btn btn-success" 
            onClick={handleSave}
            disabled={isSaving || !offer.name.trim()}
          >
            {isSaving ? 'Saving...' : (offerId ? 'Save Changes' : 'Create Offer')}
          </button>
        )}
      </div>

      {/* Steps Content */}
      <div className="steps-container">
        {/* Step 1: Targeting */}
        <FlowStep
          stepNumber={1}
          title={STEPS[0].title}
          description={STEPS[0].description}
          isActive={currentStep === 1}
          isCompleted={currentStep > 1}
          isLast={false}
          onClick={() => handleStepClick(1)}
        >
          <div className="step-content">
            <div className="form-section">
              <div className="form-section-title">Basic Information</div>
              <div className="form-group">
                <label className="form-label">Offer Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Premium Watch Upsell"
                  value={offer.name}
                  onChange={(e) => handleOfferChange({ name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Products</div>
              <div className="form-group">
                <label className="form-label">Target Products (Show when in cart)</label>
                <MultiSelect
                  type="products"
                  selectedItems={offer.targeting.targetProducts}
                  onChange={(items) => handleTargetingChange('targetProducts', items)}
                  placeholder="Search products to target..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Exclude Products (Don't show if in cart)</label>
                <MultiSelect
                  type="products"
                  selectedItems={offer.targeting.excludeProducts}
                  onChange={(items) => handleTargetingChange('excludeProducts', items)}
                  placeholder="Search products to exclude..."
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Collections</div>
              <div className="form-group">
                <label className="form-label">Target Collections</label>
                <MultiSelect
                  type="collections"
                  selectedItems={offer.targeting.targetCollections}
                  onChange={(items) => handleTargetingChange('targetCollections', items)}
                  placeholder="Search collections to target..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Exclude Collections</label>
                <MultiSelect
                  type="collections"
                  selectedItems={offer.targeting.excludeCollections}
                  onChange={(items) => handleTargetingChange('excludeCollections', items)}
                  placeholder="Search collections to exclude..."
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Customer Tags</div>
              <div className="form-group">
                <label className="form-label">Target Tags (Customer must have at least one)</label>
                <MultiSelect
                  type="tags"
                  selectedItems={offer.targeting.targetTags}
                  onChange={(items) => handleTargetingChange('targetTags', items)}
                  placeholder="Search tags to target..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Exclude Tags (Customer must NOT have any)</label>
                <MultiSelect
                  type="tags"
                  selectedItems={offer.targeting.excludeTags}
                  onChange={(items) => handleTargetingChange('excludeTags', items)}
                  placeholder="Search tags to exclude..."
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Order Value</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Minimum Order Value ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={offer.targeting.minOrderValue || ''}
                    onChange={(e) => handleTargetingChange('minOrderValue', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Maximum Order Value ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="No limit"
                    value={offer.targeting.maxOrderValue || ''}
                    onChange={(e) => handleTargetingChange('maxOrderValue', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Customer Type</div>
              <div className="form-group">
                <select
                  className="form-input"
                  value={offer.targeting.customerType}
                  onChange={(e) => handleTargetingChange('customerType', e.target.value)}
                  style={{ maxWidth: '300px' }}
                >
                  <option value="all">All customers</option>
                  <option value="first-time">First-time customers only</option>
                  <option value="returning">Returning customers only</option>
                </select>
              </div>
            </div>
          </div>
        </FlowStep>

        {/* Step 2: Content */}
        <FlowStep
          stepNumber={2}
          title={STEPS[1].title}
          description={STEPS[1].description}
          isActive={currentStep === 2}
          isCompleted={currentStep > 2}
          isLast={false}
          onClick={() => handleStepClick(2)}
        >
          <OfferEditor 
            offer={offer.content} 
            onChange={handleContentChange}
          />
        </FlowStep>

        {/* Step 3: Accepted Offers */}
        <FlowStep
          stepNumber={3}
          title={STEPS[2].title}
          description={STEPS[2].description}
          isActive={currentStep === 3}
          isCompleted={currentStep > 3}
          isLast={false}
          onClick={() => handleStepClick(3)}
        >
          <div className="step-content">
            <div className="offers-header">
              <div>
                <h3 className="offers-title">Upsell Chain</h3>
                <p className="offers-description">
                  After the customer accepts the main offer, show these additional upsell offers.
                  Add up to 6 offers that will be presented in sequence.
                </p>
              </div>
              {offer.acceptedOffers.length < 6 && (
                <button className="btn btn-primary" onClick={handleAddAcceptedOffer}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Offer
                </button>
              )}
            </div>

            <div className="offers-list">
              {offer.acceptedOffers.length === 0 ? (
                <div className="offers-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  <p>No upsell offers yet</p>
                  <span>Add offers to create a chain of upsells after the customer accepts the main offer.</span>
                </div>
              ) : (
                offer.acceptedOffers.map((offerItem, index) => (
                  <OfferCard
                    key={offerItem.id}
                    offer={offerItem}
                    index={index}
                    totalCount={offer.acceptedOffers.length}
                    type="accepted"
                    onChange={(updated) => handleUpdateAcceptedOffer(index, updated)}
                    onRemove={() => handleRemoveAcceptedOffer(index)}
                    onMoveUp={() => handleMoveAcceptedOffer(index, -1)}
                    onMoveDown={() => handleMoveAcceptedOffer(index, 1)}
                  />
                ))
              )}
            </div>
          </div>
        </FlowStep>

        {/* Step 4: Declined Offers */}
        <FlowStep
          stepNumber={4}
          title={STEPS[3].title}
          description={STEPS[3].description}
          isActive={currentStep === 4}
          isCompleted={false}
          isLast={true}
          onClick={() => handleStepClick(4)}
        >
          <div className="step-content">
            <div className="offers-header">
              <div>
                <h3 className="offers-title">Alternative Offers</h3>
                <p className="offers-description">
                  When the customer declines the main offer, show these alternative offers instead.
                  This keeps customers engaged with additional value.
                </p>
              </div>
              {offer.declinedOffers.length < 6 && (
                <button className="btn btn-primary" onClick={handleAddDeclinedOffer}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Offer
                </button>
              )}
            </div>

            <div className="offers-list">
              {offer.declinedOffers.length === 0 ? (
                <div className="offers-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h.01"/>
                  </svg>
                  <p>No declined offers yet</p>
                  <span>Add alternative offers to show when customers decline the main offer.</span>
                </div>
              ) : (
                offer.declinedOffers.map((offerItem, index) => (
                  <OfferCard
                    key={offerItem.id}
                    offer={offerItem}
                    index={index}
                    totalCount={offer.declinedOffers.length}
                    type="declined"
                    onChange={(updated) => handleUpdateDeclinedOffer(index, updated)}
                    onRemove={() => handleRemoveDeclinedOffer(index)}
                    onMoveUp={() => handleMoveDeclinedOffer(index, -1)}
                    onMoveDown={() => handleMoveDeclinedOffer(index, 1)}
                  />
                ))
              )}
            </div>

            {/* Status Toggle */}
            <div className="status-section">
              <div className="form-section">
                <div className="form-section-title">Offer Status</div>
                <div className="status-toggle">
                  <label className="toggle-container">
                    <input
                      type="checkbox"
                      checked={offer.status === 'active'}
                      onChange={(e) => handleOfferChange({ status: e.target.checked ? 'active' : 'draft' })}
                    />
                    <div className={`toggle ${offer.status === 'active' ? 'active' : ''}`}>
                      <div className="toggle-knob" />
                    </div>
                  </label>
                  <div className="status-info">
                    <span className="status-label">{offer.status === 'active' ? 'Active' : 'Draft'}</span>
                    <span className="status-desc">
                      {offer.status === 'active' 
                        ? 'This offer is live and will appear to customers' 
                        : 'This offer is saved as a draft and will not be shown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FlowStep>
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <div style={{ flex: 1 }} />
        <button 
          className="btn btn-success" 
          onClick={handleSave}
          disabled={isSaving || !offer.name.trim()}
        >
          {isSaving ? 'Saving...' : (offerId ? 'Save Changes' : 'Create Offer')}
        </button>
      </div>

      <style>{`
        .offer-builder {
          max-width: 1200px;
          margin: 0 auto;
        }
        .offer-builder-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px;
          color: #6D7175;
        }
        .flow-diagram {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 24px;
          background: white;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .flow-diagram-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .flow-diagram-step:hover {
          background: #F6F6F7;
        }
        .flow-diagram-step.active {
          background: rgba(92, 106, 196, 0.1);
        }
        .flow-diagram-step.completed {
          cursor: pointer;
        }
        .flow-diagram-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #E4E4E7;
          color: #6D7175;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        .flow-diagram-step.active .flow-diagram-number {
          background: #5C6AC4;
          color: white;
        }
        .flow-diagram-step.completed .flow-diagram-number {
          background: #008060;
          color: white;
        }
        .flow-diagram-label {
          font-size: 13px;
          font-weight: 500;
          color: #6D7175;
          transition: color 0.15s;
        }
        .flow-diagram-step.active .flow-diagram-label {
          color: #5C6AC4;
        }
        .flow-diagram-step.completed .flow-diagram-label {
          color: #008060;
        }
        .flow-diagram-connector {
          width: 40px;
          height: 2px;
          background: #E4E4E7;
          transition: background 0.2s;
        }
        .flow-diagram-connector.completed {
          background: #008060;
        }
        .step-navigation {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .step-content {
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-section {
          background: #FAFAFA;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .form-section:last-child {
          margin-bottom: 0;
        }
        .form-section-title {
          font-size: 13px;
          font-weight: 600;
          color: #202223;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E4E4E7;
        }
        .offers-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .offers-title {
          font-size: 16px;
          font-weight: 600;
          color: #202223;
          margin: 0 0 4px 0;
        }
        .offers-description {
          font-size: 13px;
          color: #6D7175;
          margin: 0;
        }
        .offers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .offers-empty {
          text-align: center;
          padding: 48px 24px;
          background: white;
          border: 2px dashed #E4E4E7;
          border-radius: 12px;
          color: #6D7175;
        }
        .offers-empty svg {
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .offers-empty p {
          font-size: 15px;
          font-weight: 600;
          color: #202223;
          margin: 0 0 4px 0;
        }
        .offers-empty span {
          font-size: 13px;
        }
        .status-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E4E4E7;
        }
        .status-toggle {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .status-toggle input {
          display: none;
        }
        .status-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .status-label {
          font-size: 14px;
          font-weight: 600;
          color: #202223;
        }
        .status-desc {
          font-size: 12px;
          color: #6D7175;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .flow-diagram {
            flex-wrap: wrap;
            gap: 8px;
          }
          .flow-diagram-connector {
            display: none;
          }
          .offers-header {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default OfferBuilder;
