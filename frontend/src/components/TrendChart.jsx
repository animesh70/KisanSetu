export default function TrendChart({ data }) {
  const values = data.map((item) => item.modalPrice || item.predictedPrice);
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${92 - ((value - min) / range) * 68}`).join(' ');
  return <div className="chart"><div className="chart-top"><div><p className="eyebrow">7-day market movement</p><h3>Price trend</h3></div><span className="trend-up">↗ Rising</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Market price trend"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#42a66b" stopOpacity=".32"/><stop offset="1" stopColor="#42a66b" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#fill)"/><polyline points={points} fill="none" stroke="#1f7a4d" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="chart-labels">{data.map((item) => <span key={item.day}>{item.day}</span>)}</div></div>;
}
