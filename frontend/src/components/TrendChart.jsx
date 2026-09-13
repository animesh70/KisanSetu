import { useTranslation } from 'react-i18next';

export default function TrendChart({ data }) {
  const { t } = useTranslation();
  const values = data.map((item) => item.modalPrice || item.predictedPrice);
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${92 - ((value - min) / range) * 68}`).join(' ');
  return <div className="chart"><div className="chart-top"><div><p className="eyebrow">{t('page.chartSevenDays')}</p><h3>{t('page.priceTrend')}</h3></div><span className="trend-up">↗ {t('page.rising')}</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={t('page.priceTrend')}><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#42a66b" stopOpacity=".32"/><stop offset="1" stopColor="#42a66b" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#fill)"/><polyline points={points} fill="none" stroke="#1f7a4d" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="chart-labels">{data.map((item, index) => <span key={item.day}>{t('page.day', { count: index + 1 })}</span>)}</div></div>;
}
