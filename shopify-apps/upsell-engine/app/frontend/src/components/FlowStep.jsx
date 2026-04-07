// FlowStep Component
// Wrapper for each step in the flow builder with visual indicators

import React from 'react';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FlowStep = ({ 
  stepNumber, 
  title, 
  description, 
  isActive, 
  isCompleted, 
  isLast,
  children,
  onClick
}) => {
  return (
    <div 
      className={`flow-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
      onClick={onClick}
    >
      <div className="flow-step-indicator">
        <div className="flow-step-number">
          {isCompleted ? <CheckIcon /> : stepNumber}
        </div>
        {!isLast && <div className="flow-step-connector" />}
      </div>
      
      <div className="flow-step-content">
        <div className="flow-step-header">
          <h3 className="flow-step-title">{title}</h3>
          {isActive && <span className="flow-step-badge">Current</span>}
          {isCompleted && <span className="flow-step-badge completed">Completed</span>}
        </div>
        <p className="flow-step-description">{description}</p>
        
        {isActive && (
          <div className="flow-step-body">
            {children}
          </div>
        )}
      </div>

      <style>{`
        .flow-step {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.2s ease;
          cursor: pointer;
          margin-bottom: 12px;
        }
        .flow-step:hover {
          border-color: #E4E4E7;
        }
        .flow-step.active {
          border-color: #5C6AC4;
          box-shadow: 0 4px 12px rgba(92, 106, 196, 0.15);
          cursor: default;
        }
        .flow-step.completed {
          border-color: #008060;
          background: rgba(0, 128, 96, 0.02);
        }
        .flow-step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .flow-step-number {
          width: 40px;
          height: 40px;
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
        .flow-step.active .flow-step-number {
          background: #5C6AC4;
          color: white;
        }
        .flow-step.completed .flow-step-number {
          background: #008060;
          color: white;
        }
        .flow-step-connector {
          width: 2px;
          flex: 1;
          min-height: 30px;
          background: #E4E4E7;
          margin-top: 8px;
        }
        .flow-step:last-child .flow-step-connector {
          display: none;
        }
        .flow-step-content {
          flex: 1;
          min-width: 0;
        }
        .flow-step-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .flow-step-title {
          font-size: 16px;
          font-weight: 600;
          color: #202223;
          margin: 0;
        }
        .flow-step-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .flow-step-badge:not(.completed) {
          background: rgba(92, 106, 196, 0.1);
          color: #5C6AC4;
        }
        .flow-step-badge.completed {
          background: rgba(0, 128, 96, 0.1);
          color: #008060;
        }
        .flow-step-description {
          font-size: 13px;
          color: #6D7175;
          margin: 0;
        }
        .flow-step-body {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #E4E4E7;
        }
      `}</style>
    </div>
  );
};

export default FlowStep;
