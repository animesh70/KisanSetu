import { useEffect, useState } from 'react';
import { ArrowRight, Bell, Boxes, CircleDollarSign, Leaf, MapPin, Menu, PackagePlus, ShieldCheck, Sparkles, TrendingUp, Truck, Users, CheckCircle2, Clock3, MessageSquareWarning } from 'lucide-react';
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
  const [offers, setOffers] = useState([]);
  const [lots, setLots] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [grievanceText, setGrievanceText] = useState('');
  const [counteringOffer, setCounteringOffer] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadDashboard = async () => {
    setLoading(true); setNotice('');
    try {
      const [prices, trend, forecast, recommendation, buyers] = await Promise.all([
        api.getPrices(filters.crop, filters.location), api.getTrend(filters.crop), api.getForecast(filters.crop), api.getRecommendation(filters), api.getBuyers()
      ]);
      setData({ prices: prices.length ? prices : fallback.prices, trend, forecast, recommendation, buyers });
    } catch { setData(fallback); setNotice('Demo data is active. Market prices, buyer offers and AI forecasts are simulated for this prototype.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const refreshWorkflow = async () => {
    try { const [nextLots, nextOffers, nextTransactions, nextLogistics] = await Promise.all([api.getLots(), api.getOffers(), api.getTransactions(), api.getLogistics()]); setLots(nextLots); setOffers(nextOffers); setTransactions(nextTransactions); setLogistics(nextLogistics); } catch { /* The dashboard still has market-data fallback for offline demo mode. */ }
  };
  useEffect(() => { refreshWorkflow(); }, []);
  const createLot = async (lot) => {
    try { const result = await api.createLot(lot); await refreshWorkflow(); setNotice(result.generatedOffer ? 'Crop lot published. It is now in My crop lots, with a matched buyer offer ready.' : 'Crop lot published successfully in My crop lots.'); document.getElementById('crop-lots')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (error) { setNotice(error.message || 'Could not publish this crop lot.'); }
    setShowLotForm(false);
  };
  const acceptOffer = async (id) => { try { await api.acceptOffer(id); await refreshWorkflow(); setNotice('Offer accepted. Transaction and payment tracking have started.'); } catch (error) { setNotice(error.message || 'Could not accept this offer.'); } };
  const respondToOffer = async (id, status) => {
    try {
      await api.respondToOffer(id, status, status === 'countered' ? counterPrice : undefined);
      await refreshWorkflow();
      setCounteringOffer(''); setCounterPrice('');
      setNotice(status === 'rejected' ? 'Offer declined. You can continue comparing verified buyers.' : 'Your counter-offer has been sent to the verified buyer for review.');
    } catch (error) { setNotice(error.message || 'Could not update this offer.'); }
  };
  const moveTransaction = async (transaction) => {
    const next = transaction.status === 'confirmed' ? 'pickup_scheduled' : transaction.status === 'pickup_scheduled' ? 'in_transit' : transaction.status === 'in_transit' ? 'delivered' : 'completed';
    try { await api.updateTransaction(transaction.id, next); await refreshWorkflow(); setNotice(`Transaction updated: ${next.replace('_', ' ')}.`); } catch { setNotice('Could not update transaction status.'); }
  };
  const confirmPayment = async (transaction) => {
    try { await api.updateTransaction(transaction.id, transaction.status, 'paid'); await refreshWorkflow(); setNotice(`Payment of ${formatPrice(transaction.amount)} marked received. Demo reference: ${transaction.paymentReference || 'KisanSetu payment'}.`); } catch (error) { setNotice(error.message || 'Could not update payment status.'); }
  };
  const submitGrievance = async (event) => { event.preventDefault(); if (!grievanceText.trim()) return; try { await api.raiseGrievance(grievanceText); setGrievanceText(''); setNotice('Grievance raised successfully. Our support team will review it.'); } catch { setNotice('Could not raise grievance.'); } };
  const resetDemo = async () => { try { await api.resetDemo(); await refreshWorkflow(); setSelectedService(''); setNotice('Demo data reset. Your pending buyer offer is ready again.'); } catch { setNotice('Could not reset demo data.'); } };

  const navigateTo = (item) => {
    setActiveNav(item);
    const targetId = { Dashboard: 'dashboard', 'Market prices': 'market-prices', 'My crop lots': 'crop-lots', 'Buyer matches': 'buyer-matches', Logistics: 'logistics', Transactions: 'transactions' }[item];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const bestMarket = [...data.prices].sort((a, b) => b.modalPrice - a.modalPrice)[0];
  const pendingOfferCount = offers.filter((offer) => offer.status === 'pending').length;
  const navItems = [{ label: 'Dashboard', icon: Boxes }, { label: 'Market prices', icon: TrendingUp }, { label: 'My crop lots', icon: PackagePlus }, { label: 'Buyer matches', icon: Users }, { label: 'Logistics', icon: Truck }, { label: 'Transactions', icon: CircleDollarSign }];
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><Leaf size={23}/></span><div><strong>KisanSetu</strong><small>Market intelligence</small></div></div><nav>{navItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={activeNav === label ? 'active' : ''} onClick={() => navigateTo(label)}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-footer"><div className="profile-avatar">SP</div><div><strong>Sanjay Patil</strong><small>Farmer · Nashik</small></div></div></aside>
    {mobileNavOpen && <div className="mobile-nav-layer"><button className="mobile-nav-backdrop" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}/><aside className="mobile-nav" aria-label="Mobile navigation"><div className="mobile-nav-head"><div className="brand"><span className="brand-mark"><Leaf size={21}/></span><div><strong>KisanSetu</strong><small>Market intelligence</small></div></div><button type="button" className="icon-button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>×</button></div><nav>{navItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={activeNav === label ? 'active' : ''} onClick={() => { navigateTo(label); setMobileNavOpen(false); }}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-footer"><div className="profile-avatar">SP</div><div><strong>Sanjay Patil</strong><small>Farmer · Nashik</small></div></div></aside></div>}
    <main id="dashboard"><header className="topbar"><button className="mobile-menu" aria-label="Open navigation menu" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu/></button><div><p className="eyebrow">GOOD MORNING, SANJAY</p><h1>Make every harvest count.</h1></div><div className="top-actions"><div className="notification-wrap"><button className="notification" aria-label={`${pendingOfferCount || 1} notification${pendingOfferCount === 1 ? '' : 's'}`} aria-expanded={showNotifications} onClick={() => setShowNotifications(!showNotifications)}><Bell size={20}/>{(pendingOfferCount || 1) > 0 && <i/>}</button>{showNotifications && <div className="notification-panel" role="status"><div className="notification-panel-head"><div><strong>Notifications</strong><small>{pendingOfferCount || 1} update{(pendingOfferCount || 1) === 1 ? '' : 's'} for you</small></div><button type="button" aria-label="Close notifications" onClick={() => setShowNotifications(false)}>×</button></div><div className="notification-item"><span className="notification-dot"/><div><strong>{pendingOfferCount ? `${pendingOfferCount} buyer offer${pendingOfferCount === 1 ? '' : 's'} ready` : 'Your buyer offer is ready'}</strong><p>Review the verified buyer match and choose to accept, decline, or counter.</p><button type="button" onClick={() => { setShowNotifications(false); navigateTo('Transactions'); }}>Review offer <ArrowRight size={14}/></button></div></div></div>}</div><button className="help-button" onClick={resetDemo}>Reset demo</button></div></header>
      <section className="hero-card"><div><p className="eyebrow">SELL SMARTER WITH KISANSETU</p><h2>Find the right buyer at the right time.</h2><p>Compare nearby mandi rates, receive verified buyer offers and know your best selling window.</p><button className="light-button" onClick={() => setShowLotForm(true)}>Create crop lot <ArrowRight size={18}/></button></div><div className="hero-art"><div className="sun"/><div className="hill hill-one"/><div className="hill hill-two"/><span>🌾</span></div></section>
      <section className="search-panel"><div className="search-title"><Sparkles size={20}/><span>Check your selling opportunity</span></div><label>Crop<select value={filters.crop} onChange={(event) => setFilters({ ...filters, crop: event.target.value })}><option>Onion</option><option>Tomato</option><option>Soybean</option></select></label><label>Location<input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}/></label><label>Quantity (q)<input type="number" value={filters.quantity} onChange={(event) => setFilters({ ...filters, quantity: event.target.value })}/></label><button className="primary-button" onClick={loadDashboard}>{loading ? 'Checking…' : 'Check prices'}</button></section>
      {notice && <div className="notice notice-toast" role="status" aria-live="polite"><span className="toast-icon"><CheckCircle2 size={18}/></span><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
      <section className="stats-grid"><StatCard label="Best mandi rate" value={formatPrice(bestMarket?.modalPrice || 0)} note={`${bestMarket?.mandiName || 'Nearby mandi'} · per quintal`}/><StatCard label="Predicted peak" value={formatPrice(data.forecast.predictedPeak)} note="Expected within the next 7 days" accent="amber"/><StatCard label="Verified buyer offer" value={formatPrice(data.recommendation.recommendedBuyer?.offerPrice || 0)} note={`${data.recommendation.recommendedBuyer?.name || 'No buyer'} · per quintal`} accent="blue"/><StatCard label="Your best net price" value={formatPrice(data.recommendation.expectedNetPrice)} note="After estimated logistics cost" accent="purple"/></section>
      <section className="two-column"><TrendChart data={data.trend}/><article className="recommendation"><div className="recommendation-icon"><Sparkles size={20}/></div><p className="eyebrow">SMART SELL / HOLD · DEMO AI PREDICTION</p><h3 className="recommendation-status">{data.recommendation.action === 'sell' ? 'Sell now' : 'Hold briefly'}</h3><h2 className="recommendation-message">{data.recommendation.action === 'sell' ? `Sell now · ${formatPrice(data.forecast.currentPrice)}/q` : `Wait ~5 days · ${formatPrice(data.forecast.predictedPeak)}/q expected`}</h2><p className="recommendation-price">{formatPrice(data.recommendation.expectedNetPrice)} <span>/ quintal net</span></p><div className="window"><TrendingUp size={18}/><div><strong>{data.recommendation.sellingWindow}</strong><small>Predicted from seeded historical data; not a live market guarantee.</small></div></div><button className="secondary-button" onClick={() => setShowLotForm(true)}>Create lot to act on this <ArrowRight size={17}/></button></article></section>
      <section id="market-prices" className="section-header"><div><p className="eyebrow">MARKET INTELLIGENCE · SIMULATED DATA</p><h2>Nearby mandi prices</h2><small className="data-note">Sample mandi prices for this hackathon demo — replace with a Government market-data API before deployment.</small></div><button className="text-button" onClick={() => setNotice(`Showing all ${data.prices.length} available demo mandi prices for ${filters.crop}.`)}>View all prices <ArrowRight size={16}/></button></section>
      <section className="table-card price-scroll"><div className="price-table header-row"><span>Mandi market</span><span>Distance</span><span>Modal price</span><span>Est. transport/q</span><span>Net /q</span></div>{data.prices.map((price, index) => { const transport = Math.round((price.distanceKm * 12) / Math.max(Number(filters.quantity), 1)); const net = price.modalPrice - transport; return <div className="price-table" key={price.id || price.mandiName}><div><strong>{price.mandiName}</strong><small>{price.district}, Maharashtra{index === 0 ? ' · Nearby' : ''}</small></div><span>{price.distanceKm} km</span><strong>{formatPrice(price.modalPrice)}</strong><span>{formatPrice(transport)}</span><strong>{formatPrice(net)}</strong></div>; })}</section>
      <section className="net-card"><div><p className="eyebrow">NET REALISATION COMPARISON · ESTIMATED</p><h3>Choose the option that leaves you with more</h3><p>Net price = selling price − estimated transport cost (₹12/km ÷ your lot quantity).</p></div><div className="net-options">{(data.recommendation.options || []).slice(0, 3).map((option) => <div key={`${option.type}-${option.name}`}><small>{option.type === 'buyer' ? 'Verified buyer' : 'Mandi'}</small><strong>{option.name}</strong><span>{formatPrice(option.netPrice)}/q net</span></div>)}</div></section>
      <section id="crop-lots" className="section-header"><div><p className="eyebrow">YOUR PRODUCE</p><h2>My crop lots</h2><small className="data-note">Published lots are shown here. A buyer match is generated automatically for eligible demo lots.</small></div><button className="text-button" onClick={() => setShowLotForm(true)}>Create crop lot <PackagePlus size={16}/></button></section>
      <section className="lot-grid">{lots.length ? lots.map((lot) => <article className="lot-card" key={lot.id}><div className="lot-card-head"><div><span className="lot-status">{lot.status || 'open'}</span><h3>{lot.crop}</h3></div><span className="lot-quantity">{lot.quantity} q</span></div><div className="lot-meta"><span><small>Variety</small><strong>{lot.variety || 'Not specified'}</strong></span><span><small>Quality</small><strong>Grade {lot.grade}</strong></span><span><small>Asking price</small><strong>{formatPrice(lot.askingPrice)}/q</strong></span><span><small>Harvested</small><strong>{lot.harvestDate ? new Date(`${lot.harvestDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not specified'}</strong></span></div><button className="outline-button" onClick={() => { setNotice(`${lot.crop} lot: ${lot.quantity} q, Grade ${lot.grade}, asking ${formatPrice(lot.askingPrice)}/q.`); document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Review matching offers <ArrowRight size={15}/></button></article>) : <section className="empty-state"><PackagePlus size={21}/><div><strong>No crop lots published yet</strong><p>Create your first lot to start matching with buyers.</p></div><button className="outline-button" onClick={() => setShowLotForm(true)}>Create crop lot</button></section>}</section>
      <section id="buyer-matches" className="section-header"><div><p className="eyebrow">VERIFIED DEMAND · SIMULATED BUYER PROFILES</p><h2>Buyers matched for you</h2><small className="data-note">Demo offers and buyer verification status are simulated — clearly labelled for a responsible presentation.</small></div><button className="text-button" onClick={() => setNotice(`Showing all ${data.buyers.length} simulated buyer profiles, ranked by offer, distance, quantity fit and reliability.`)}>See all buyers <ArrowRight size={16}/></button></section>
      <section className="buyer-grid">{data.buyers.slice(0, 3).map((buyer, index) => { const transport = Math.round(((buyer.distanceKm || 0) * 12) / Math.max(Number(filters.quantity), 1)); return <article className="buyer-card" key={buyer.id}><div className="buyer-top"><div className="buyer-logo">{buyer.companyName.slice(0, 1)}</div>{buyer.verified && <span className="verified"><ShieldCheck size={15}/> Rank #{index + 1} · Demo verified</span>}</div><h3>{buyer.companyName}</h3><p><MapPin size={15}/>{buyer.location} · Needs {buyer.requiredQuantity} q</p><div className="buyer-bottom"><div><small>Indicative offer</small><strong>{formatPrice(buyer.targetPrice)}/q</strong></div><div><small>Estimated net</small><strong>{formatPrice(buyer.targetPrice - transport)}/q</strong></div></div><button className="outline-button" onClick={() => setNotice(`${buyer.companyName}: ₹${transport}/q estimated transport, ${formatPrice(buyer.targetPrice - transport)}/q net. Ranking also considers quantity, grade and reliability.`)}>View net comparison</button></article>; })}</section>
      <section id="logistics" className="section-header"><div><p className="eyebrow">MOVE AND STORE</p><h2>Logistics options</h2></div></section>
      <section className="service-grid">{(logistics.length ? logistics : [{ id: 'transport', provider: 'Kisan Haul', type: 'Transport', capacity: 150 }, { id: 'storage', provider: 'Nashik Cold Store', type: 'Storage', ratePerDay: 18 }]).map((service) => <article className="service-card" key={service.id}><Truck size={23}/><div><strong>{service.provider}</strong><p>{service.type} · {service.capacity ? `Capacity ${service.capacity} quintals` : `₹${service.ratePerDay} per quintal/day`}</p></div><button className="outline-button" onClick={() => { setSelectedService(service.provider); setNotice(`${service.provider} selected for your crop lot.`); }}>{selectedService === service.provider ? 'Selected' : 'Select'}</button></article>)}</section>
      <section id="transactions" className="section-header"><div><p className="eyebrow">ORDER STATUS</p><h2>Transactions</h2></div></section>
      {offers.filter((offer) => offer.status === 'pending').map((offer) => <section className="transaction-card" key={offer.id}><div className="transaction-status">Demo buyer offer</div><div><strong>Crop lot · {offer.quantity} quintals</strong><p>Buyer offer: {formatPrice(offer.pricePerUnit)} per quintal · {offer.message}</p>{counteringOffer === offer.id && <div className="counter-row"><input aria-label="Counter-offer price" type="number" min="1" placeholder="Your ₹/q counter" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)}/><button className="outline-button" onClick={() => respondToOffer(offer.id, 'countered')}>Send counter</button></div>}</div><div className="offer-actions"><button className="outline-button" onClick={() => setCounteringOffer(counteringOffer === offer.id ? '' : offer.id)}>Counter</button><button className="outline-button" onClick={() => respondToOffer(offer.id, 'rejected')}>Decline</button><button className="primary-button" onClick={() => acceptOffer(offer.id)}>Accept offer</button></div></section>)}
      {offers.filter((offer) => offer.status === 'countered').map((offer) => <section className="transaction-card" key={offer.id}><div className="transaction-status">Counter sent</div><div><strong>Your counter-offer: {formatPrice(offer.counterPrice)}/q</strong><p>{offer.counterMessage} This is a simulated negotiation state for the demo.</p></div></section>)}
      {transactions.map((transaction) => <section className="transaction-card" key={transaction.id}><div className="transaction-status"><CheckCircle2 size={13}/> {transaction.paymentStatus.replaceAll('_', ' ')}</div><div><strong>{formatPrice(transaction.amount)} transaction</strong><p>{transaction.status.replaceAll('_', ' ')} · {selectedService || 'Select logistics above'}</p><small className="payment-detail">{transaction.paymentMethod || 'Demo payment'} · Ref: {transaction.paymentReference || 'Generated after acceptance'}</small><div className="transaction-steps"><span className={['pickup_scheduled', 'in_transit', 'delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>1. Pickup</span><span className={['in_transit', 'delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>2. Transit</span><span className={['delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>3. Delivery</span><span className={transaction.paymentStatus === 'paid' ? 'done' : ''}>4. Payment</span></div></div><div className="offer-actions">{transaction.status !== 'completed' && <button className="primary-button" onClick={() => moveTransaction(transaction)}><Clock3 size={16}/> Next step</button>}{['delivered', 'completed'].includes(transaction.status) && transaction.paymentStatus !== 'paid' && <button className="outline-button" onClick={() => confirmPayment(transaction)}>Confirm payment received</button>}</div></section>)}
      {!offers.some((offer) => offer.status === 'pending') && !transactions.length && <section className="empty-state"><CheckCircle2 size={21}/><div><strong>No active offers yet</strong><p>Create a crop lot to start receiving buyer offers.</p></div></section>}
      <section className="support-card"><MessageSquareWarning size={22}/><div><p className="eyebrow">NEED HELP?</p><h3>Raise a grievance</h3><p>Report an offer, logistics, quality, or payment issue.</p></div><form onSubmit={submitGrievance}><input value={grievanceText} onChange={(event) => setGrievanceText(event.target.value)} aria-label="Describe your concern" placeholder="Describe your concern"/><button className="outline-button">Submit</button></form></section>
    </main>
    {showLotForm && <LotModal crop={filters.crop} onClose={() => setShowLotForm(false)} onSave={createLot}/>} 
  </div>;
}
