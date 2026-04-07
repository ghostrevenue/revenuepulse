import React from 'react';

const FunnelChart = ({ data = [] }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="funnel-chart">
      {data.map((stage, index) => {
        const width = (stage.value / maxValue) * 100;
        const prevWidth = index > 0 ? (data[index - 1].value / maxValue) * 100 : 100;
        const gap = (prevWidth - width) / 2;

        return (
          <div key={stage.stage} className="funnel-stage">
            <div className="funnel-stage-header">
              <span className="funnel-stage-name">{stage.stage}</span>
              <span className="funnel-stage-value">
                {stage.value.toLocaleString()} ({stage.percentage}%)
              </span>
            </div>
            <div className="funnel-bar-container">
              <div
                className={`funnel-bar ${stage.color}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Conversion Rates between stages */}
      {data.length >= 2 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E4E4E7' }}>
          {data.slice(1).map((stage, index) => {
            const prevStage = data[index];
            const rate = ((stage.value / prevStage.value) * 100).toFixed(1);
            return (
              <div key={stage.stage} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#5C6AC4' }}>{rate}%</div>
                <div style={{ fontSize: '11px', color: '#6D7175' }}>{prevStage.stage} → {stage.stage}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FunnelChart;
