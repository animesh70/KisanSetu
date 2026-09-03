import { useEffect, useState } from 'react';
import { ArrowRight, Bell, Boxes, CircleDollarSign, Leaf, MapPin, Menu, PackagePlus, ShieldCheck, Sparkles, TrendingUp, Truck, Users } from 'lucide-react';
import { api } from './services/api';
import StatCard from './components/StatCard';
import TrendChart from './components/TrendChart';
import LotModal from './components/LotModal';

const fallback = {
  prices: [
    { id: 'price-1', mandiName: 'Lasalgaon APMC', district: 'Nashik', modalPrice: 2450, maxPrice: 2800, distanceKm: 28 },
    { id: 'price-2', mandiName: 'Pimpalgaon Baswant APMC', district: 'Nashik', modalPrice: 2520, maxPrice: 2900, distanceKm: 42 },
    { id: 'price-3', mandiName: 'Pune APMC', district: 'Pune', modalPrice: 2620, maxPrice: 3000, distanceKm: 185 }
  ],
  trend: [2200, 2250, 2300, 2280, 2350, 2400, 2450].map((modalPrice, index) => ({ day: `Day ${index + 1}`, modalPrice })),
  forecast: { currentPrice: 2450, predictedPeak: 2620, forecast: [2490, 2515, 2550, 2580, 2600, 2620, 2610].map((predictedPrice, index) => ({ day: `+${index + 1} day`, predictedPrice })) },
  recommendation: { recommendedBuyer: { name: 'FreshMart Foods', offerPrice: 2700, matchScore: 94.4 }, recommendedMarket: { name: 'Pune APMC', modalPrice: 2620, distanceKm: 185 }, sellingWindow: 'Hold for 5–7 days if storage is available', expectedNetPrice: 2665, reasons: ['Verified buyer with the strongest crop/quantity match', 'Forecast indicates a rising price trend', 'Pickup can be arranged within 24 hours'] },
  buyers: [
    { id: 'buyer-1', companyName: 'FreshMart Foods', location: 'Pune', reliabilityScore: 4.8, requiredQuantity: 120, targetPrice: 2700, verified: true },
    { id: 'buyer-2', companyName: 'MahaAgro Exports', location: 'Nashik', reliabilityScore: 4.6, requiredQuantity: 80, targetPrice: 2650, verified: true },
    { id: 'buyer-3', companyName: 'Green Basket Retail', location: 'Mumbai', reliabilityScore: 4.5, requiredQuantity: 50, targetPrice: 2550, verified: true }
  ]
};

function formatPrice(value) { return `₹${Number(value).toLocaleString('en-IN')}`; }

export default function App() {
  const [filters, setFilters] = useState({ crop: 'Onion', location: 'Nashik', quantity: 100, grade: 'A' });
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [showLotForm, setShowLotForm] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  const loadDashboard = async () => {
    setLoading(true); setNotice('');
    try {
      const [prices, trend, forecast, recommendation, buyers] = await Promise.all([
        api.getPrices(filters.crop, filters.location), api.getTrend(filters.crop), api.getForecast(filters.crop), api.getRecommendation(filters), api.getBuyers()
      ]);
      setData({ prices: prices.length ? prices : fallback.prices, trend, forecast, recommendation, buyers });
    } catch { setData(fallback); setNotice('Showing demo data — start the KisanSetu backend to use live API results.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);
  const createLot = async (lot) => {
    try { await api.createLot(lot); setNotice('Crop lot published successfully. Verified buyers can now send offers.'); }
    catch { setNotice('Lot saved for the demo. Start the backend to persist it.'); }
    setShowLotForm(false);
  };

  const navigateTo = (item) => {
    setActiveNav(item);
    if (item === 'My crop lots') { setShowLotForm(true); return; }
    const targetId = { Dashboard: 'dashboard', 'Market prices': 'market-prices', 'Buyer matches': 'buyer-matches', Logistics: 'logistics', Transactions: 'transactions' }[item];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const bestMarket = [...data.prices].sort((a, b) => b.modalPrice - a.modalPrice)[0];
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><Leaf size={23}/></span><div><strong>KisanSetu</strong><small>Market intelligence</small></div></div><nav>{[{ label: 'Dashboard', icon: Boxes }, { label: 'Market prices', icon: TrendingUp }, { label: 'My crop lots', icon: PackagePlus }, { label: 'Buyer matches', icon: Users }, { label: 'Logistics', icon: Truck }, { label: 'Transactions', icon: CircleDollarSign }].map(({ label, icon: Icon }) => <button type="button" key={label} className={activeNav === label ? 'active' : ''} onClick={() => navigateTo(label)}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-footer"><div className="profile-avatar">SP</div><div><strong>Sanjay Patil</strong><small>Farmer · Nashik</small></div></div></aside>
    <main id="dashboard"><header className="topbar"><button className="mobile-menu" onClick={() => navigateTo('Dashboard')}><Menu/></button><div><p className="eyebrow">GOOD MORNING, SANJAY</p><h1>Make every harvest count.</h1></div><div className="top-actions"><button className="notification"><Bell size={20}/><i/></button><button className="help-button">Help centre</button></div></header>
      <section className="hero-card"><div><p className="eyebrow">SELL SMARTER WITH KISANSETU</p><h2>Find the right buyer at the right time.</h2><p>Compare nearby mandi rates, receive verified buyer offers and know your best selling window.</p><button className="light-button" onClick={() => setShowLotForm(true)}>Create crop lot <ArrowRight size={18}/></button></div><div className="hero-art"><div className="sun"/><div className="hill hill-one"/><div className="hill hill-two"/><span>🌾</span></div></section>
      <section className="search-panel"><div className="search-title"><Sparkles size={20}/><span>Check your selling opportunity</span></div><label>Crop<select value={filters.crop} onChange={(event) => setFilters({ ...filters, crop: event.target.value })}><option>Onion</option><option>Tomato</option><option>Soybean</option></select></label><label>Location<input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}/></label><label>Quantity (q)<input type="number" value={filters.quantity} onChange={(event) => setFilters({ ...filters, quantity: event.target.value })}/></label><button className="primary-button" onClick={loadDashboard}>{loading ? 'Checking…' : 'Check prices'}</button></section>
      {notice && <div className="notice">{notice}</div>}
      <section className="stats-grid"><StatCard label="Best mandi rate" value={formatPrice(bestMarket?.modalPrice || 0)} note={`${bestMarket?.mandiName || 'Nearby mandi'} · per quintal`}/><StatCard label="Predicted peak" value={formatPrice(data.forecast.predictedPeak)} note="Expected within the next 7 days" accent="amber"/><StatCard label="Verified buyer offer" value={formatPrice(data.recommendation.recommendedBuyer?.offerPrice || 0)} note={`${data.recommendation.recommendedBuyer?.name || 'No buyer'} · per quintal`} accent="blue"/><StatCard label="Your best net price" value={formatPrice(data.recommendation.expectedNetPrice)} note="After estimated logistics cost" accent="purple"/></section>
      <section className="two-column"><TrendChart data={data.trend}/><article className="recommendation"><div className="recommendation-icon"><Sparkles size={20}/></div><p className="eyebrow">SMART RECOMMENDATION</p><h3>Best selling option</h3><h2>{data.recommendation.recommendedBuyer?.name || 'Compare market options'}</h2><p className="recommendation-price">{formatPrice(data.recommendation.expectedNetPrice)} <span>/ quintal net</span></p><div className="window"><TrendingUp size={18}/><div><strong>{data.recommendation.sellingWindow}</strong><small>Based on price forecast and buyer demand</small></div></div><button className="secondary-button" onClick={() => setShowLotForm(true)}>Sell this crop <ArrowRight size={17}/></button></article></section>
      <section id="market-prices" className="section-header"><div><p className="eyebrow">MARKET INTELLIGENCE</p><h2>Nearby mandi prices</h2></div><button className="text-button" onClick={() => navigateTo('Market prices')}>View all prices <ArrowRight size={16}/></button></section>
      <section className="table-card"><div className="price-table header-row"><span>Mandi market</span><span>Distance</span><span>Modal price</span><span>Highest price</span><span/></div>{data.prices.map((price, index) => <div className="price-table" key={price.id || price.mandiName}><div><strong>{price.mandiName}</strong><small>{price.district}, Maharashtra</small></div><span>{price.distanceKm} km</span><strong>{formatPrice(price.modalPrice)}</strong><span>{formatPrice(price.maxPrice)}</span>{index === 0 ? <span className="best-badge">Best nearby</span> : <span/>}</div>)}</section>
      <section id="buyer-matches" className="section-header"><div><p className="eyebrow">VERIFIED DEMAND</p><h2>Buyers matched for you</h2></div><button className="text-button" onClick={() => navigateTo('Buyer matches')}>See all buyers <ArrowRight size={16}/></button></section>
      <section className="buyer-grid">{data.buyers.slice(0, 3).map((buyer) => <article className="buyer-card" key={buyer.id}><div className="buyer-top"><div className="buyer-logo">{buyer.companyName.slice(0, 1)}</div>{buyer.verified && <span className="verified"><ShieldCheck size={15}/> Verified</span>}</div><h3>{buyer.companyName}</h3><p><MapPin size={15}/>{buyer.location} · Needs {buyer.requiredQuantity} q</p><div className="buyer-bottom"><div><small>Target offer</small><strong>{formatPrice(buyer.targetPrice)}/q</strong></div><div><small>Trust score</small><strong>★ {buyer.reliabilityScore}</strong></div></div><button className="outline-button" onClick={() => setNotice(`${buyer.companyName} needs ${buyer.requiredQuantity} quintals and targets ${formatPrice(buyer.targetPrice)}/quintal.`)}>View requirement</button></article>)}</section>
      <section id="logistics" className="section-header"><div><p className="eyebrow">MOVE AND STORE</p><h2>Logistics options</h2></div></section>
      <section className="service-grid"><article className="service-card"><Truck size={23}/><div><strong>Kisan Haul transport</strong><p>Nashik–Pune · Capacity 150 quintals</p></div><button className="outline-button" onClick={() => setNotice('Kisan Haul selected. The provider will be contacted after you accept a buyer offer.')}>Select</button></article><article className="service-card"><Boxes size={23}/><div><strong>Nashik Cold Store</strong><p>Storage available · ₹18 per quintal/day</p></div><button className="outline-button" onClick={() => setNotice('Nashik Cold Store saved as your preferred storage option.')}>Select</button></article></section>
      <section id="transactions" className="section-header"><div><p className="eyebrow">ORDER STATUS</p><h2>Transactions</h2></div></section>
      <section className="transaction-card"><div className="transaction-status">Pending offer</div><div><strong>Onion · 100 quintals</strong><p>FreshMart Foods offered ₹2,680 per quintal</p></div><button className="primary-button" onClick={() => setNotice('Offer accepted for the demo. Payment tracking will begin after pickup confirmation.')}>Accept offer</button></section>
    </main>
    {showLotForm && <LotModal crop={filters.crop} onClose={() => setShowLotForm(false)} onSave={createLot}/>} 
  </div>;
}
