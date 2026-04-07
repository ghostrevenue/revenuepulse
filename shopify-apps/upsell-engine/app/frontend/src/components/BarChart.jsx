import React, { useState } from 'react';

const BarChart = ({ data = [], height = 120 }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  // Determine which labels to show (every 5th item for space)
  const showLabel = (index) => {
    if (data.length <= 10) return true;
    return index % Math.ceil(data.length / 10) === 0;
  };

  return (
    <div>
      <div className="bar-chart" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = range > 0
            ? ((item.value - minValue) / range) * 0.7 + 0.3 // Min height 30%
            : 0.5;
          const heightPercent = barHeight * 100;

          return (
            <div
              key={index}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                position: 'relative',
              }}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {hoveredBar === index && (
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1A1A2E',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}>
                  ${item.value.toLocaleString()}
                </div>
              )}
              <div
                className="bar-chart-bar"
                style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  minHeight: '4px',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: '1px solid #E4E4E7',
        marginTop: '8px',
      }}>
        {data.filter((_, i) => showLabel(i)).map((item, index) => (
          <span key={index} className="bar-chart-bar-label" style={{ position: 'relative', bottom: 0, left: 0, transform: 'none' }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
