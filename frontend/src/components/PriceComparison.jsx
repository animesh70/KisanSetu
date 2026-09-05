import { useMemo, useState } from 'react';
import { BarChart3, Store, TrendingUp } from 'lucide-react';

export default function PriceComparison({ crop, mandiPrice, onlinePrices }) {
  const [mode, setMode] = useState('average');
  const [hover, setHover] = useState(null);
  const stores = useMemo(() => {
    const values = onlinePrices || [];
    return values.length ? values : [
      { store: 'KisanSetu Online Store', price: Math.round((mandiPrice?.modalPrice || 0) * 1.16) },
      { store: 'FreshCart Wholesale', price: Math.round((mandiPrice?.modalPrice || 0) * 1.19) },
      { store: 'AgroDirect', price: Math.round((mandiPrice?.modalPrice || 0) * 1.13) }
    ];
  }, [onlinePrices, mandiPrice]);
  const onlineAvg = Math.round(stores.reduce((sum, item) => sum + Number(item.price), 0) / stores.length);
  const rows = [{ label: 'Mandi modal price', value: Number(mandiPrice?.modalPrice || 0), source: mandiPrice?.mandiName || 'Nearby mandi' }, ...stores.map((item) => ({ label: item.store, value: Number(item.price), source: 'Online store' }))];
  const max = Math.max(...rows.map((r) => r.value), 1);
  const selected = mode === 'average' ? onlineAvg : Number(stores[0]?.price || 0);
  const diff = selected - Number(mandiPrice?.modalPrice || 0);
  return <article className="comparison-card">
    <div className="comparison-top"><div><p className="eyebrow">MANDI VS ONLINE STORE</p><h3>{crop} price comparison</h3><p className="comparison-sub">All prices are shown per quintal. Hover a bar for details.</p></div><div className="comparison-toggle"><button className={mode === 'average' ? 'selected' : ''} onClick={() => setMode('average')}>Online avg</button><button className={mode === 'store' ? 'selected' : ''} onClick={() => setMode('store')}>Top store</button></div></div>
    <div className="comparison-summary"><div><span>Mandi</span><strong>₹{Number(mandiPrice?.modalPrice || 0).toLocaleString('en-IN')}</strong></div><TrendingUp size={18}/><div><span>Online</span><strong>₹{selected.toLocaleString('en-IN')}</strong></div><b className={diff >= 0 ? 'gain' : 'loss'}>{diff >= 0 ? '+' : ''}₹{diff.toLocaleString('en-IN')} / q</b></div>
    <div className="bar-chart" role="img" aria-label={`${crop} mandi and online store price comparison`}>{rows.map((row, index) => <div className="bar-row" key={`${row.label}-${index}`} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}><div className="bar-label"><span>{row.label}</span><small>{row.source}</small></div><div className="bar-track"><div className={`bar-fill ${index === 0 ? 'mandi' : 'online'}`} style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }}><strong>₹{row.value.toLocaleString('en-IN')}</strong></div>{hover === index && <div className="bar-tooltip">₹{row.value.toLocaleString('en-IN')} / quintal</div>}</div></div>)}</div>
    <div className="comparison-foot"><span><BarChart3 size={15}/> Easy price comparison</span><span>Online average: ₹{onlineAvg.toLocaleString('en-IN')}/q</span></div>
  </article>;
}
