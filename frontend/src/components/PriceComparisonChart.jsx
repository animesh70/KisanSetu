import { useState } from 'react';

function formatPrice(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }

export default function PriceComparisonChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.mandiPrice, item.onlinePrice]));
  const groupWidth = 100 / Math.max(data.length, 1);

  return <div className="chart comparison-chart">
    <div className="chart-top">
      <div><p className="eyebrow">MANDI VS ONLINE STORE</p><h3>Crop-wise price comparison</h3></div>
      <div className="legend"><span className="legend-dot mandi"/>Mandi<span className="legend-dot online"/>Online store</div>
    </div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Mandi vs online store price comparison" className="comparison-svg">
      {data.map((item, index) => {
        const groupStart = index * groupWidth;
        const mandiHeight = (item.mandiPrice / maxValue) * 78;
        const onlineHeight = (item.onlinePrice / maxValue) * 78;
        const barWidth = groupWidth * 0.28;
        const isHovered = hovered === item.crop;
        return <g key={item.crop}
          onMouseEnter={() => setHovered(item.crop)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'pointer' }}>
          <rect x={groupStart + groupWidth * 0.18} y={92 - mandiHeight} width={barWidth} height={mandiHeight} fill={isHovered ? '#16643d' : '#1f7a4d'} rx="1.2"/>
          <rect x={groupStart + groupWidth * 0.54} y={92 - onlineHeight} width={barWidth} height={onlineHeight} fill={isHovered ? '#3b7ba0' : '#4e91bc'} rx="1.2"/>
        </g>;
      })}
    </svg>
    <div className="chart-labels comparison-labels">
      {data.map((item) => <span key={item.crop} className={hovered === item.crop ? 'active' : ''} onMouseEnter={() => setHovered(item.crop)} onMouseLeave={() => setHovered(null)}>{item.crop}</span>)}
    </div>
    {hovered && (() => {
      const item = data.find((entry) => entry.crop === hovered);
      const diff = item.onlinePrice - item.mandiPrice;
      return <div className="comparison-tooltip">
        <strong>{item.crop}</strong>
        <span>Mandi: {formatPrice(item.mandiPrice)}/quintal</span>
        <span>{item.platform}: {formatPrice(item.onlinePrice)}/quintal</span>
        <span className={diff >= 0 ? 'trend-up' : ''}>{diff >= 0 ? '↑' : '↓'} {formatPrice(Math.abs(diff))} {diff >= 0 ? 'higher online' : 'higher at mandi'}</span>
      </div>;
    })()}
  </div>;
}
