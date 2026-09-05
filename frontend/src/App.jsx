import { useEffect, useState } from 'react';
import { ArrowRight, Bell, Boxes, CircleDollarSign, Landmark, Leaf, MapPin, Menu, PackagePlus, ShieldCheck, Sparkles, TrendingUp, Truck, Users, CheckCircle2, Clock3, MessageSquareWarning, Trash2 } from 'lucide-react';
import { api } from './services/api';
import StatCard from './components/StatCard';
import TrendChart from './components/TrendChart';
import LotModal from './components/LotModal';
import LoanModal from './components/LoanModal';
import LoanReceipt from './components/LoanReceipt';
import PriceComparisonChart from './components/PriceComparisonChart';

const fallback = {
  prices: [
    { id: 'price-1', mandiName: 'Lasalgaon APMC', district: 'Nashik', modalPrice: 2450, maxPrice: 2800, distanceKm: 28 },
    { id: 'price-2', mandiName: 'Pimpalgaon Baswant APMC', district: 'Nashik', modalPrice: 2520, maxPrice: 2900, distanceKm: 42 },
    { id: 'price-3', mandiName: 'Pune APMC', district: 'Pune', modalPrice: 2620, maxPrice: 3000, distanceKm: 185 }
  ],
  trend: [2200, 2250, 2300, 2280, 2350, 2400, 2450].map((modalPrice, index) => ({ day: `Day ${index + 1}`, modalPrice })),
  forecast: { currentPrice: 2450, predictedPeak: 2620, forecast: [2490, 2515, 2550, 2580, 2600, 2620, 2610].map((predictedPrice, index) => ({ day: `+${index + 1} day`, predictedPrice })) },
  recommendation: { action: 'hold', daysToPeak: 6, expectedGain: 170, decisionText: 'Hold 6 days · expected +₹170/q', recommendedBuyer: { name: 'FreshMart Foods', offerPrice: 2700, matchScore: 94.4 }, recommendedMarket: { name: 'Pune APMC', modalPrice: 2620, distanceKm: 185 }, sellingWindow: 'Hold for 6 days; sell near the predicted peak (storage required)', expectedNetPrice: 2665, reasons: ['Verified buyer ranked by price, distance, quantity fit and reliability', 'Forecast peak is ₹2,620/quintal on day 6', 'Pickup can be arranged within 24 hours'], options: [{ name: 'FreshMart Foods', type: 'buyer', netPrice: 2678, matchScore: 94.4 }, { name: 'MahaAgro Exports', type: 'buyer', netPrice: 2646, matchScore: 91.2 }, { name: 'Green Basket Retail', type: 'buyer', netPrice: 2529, matchScore: 77.8 }, { name: 'Pune APMC', type: 'mandi', netPrice: 2598 }] },
  buyers: [
    { id: 'buyer-1', companyName: 'FreshMart Foods', location: 'Pune', reliabilityScore: 4.8, requiredQuantity: 120, targetPrice: 2700, verified: true },
    { id: 'buyer-2', companyName: 'MahaAgro Exports', location: 'Nashik', reliabilityScore: 4.6, requiredQuantity: 80, targetPrice: 2650, verified: true },
    { id: 'buyer-3', companyName: 'Green Basket Retail', location: 'Mumbai', reliabilityScore: 4.5, requiredQuantity: 50, targetPrice: 2550, verified: true }
  ],
  comparison: [
    { crop: 'Onion', mandiPrice: 2530, onlinePrice: 3150, platform: 'AgriMart Online' },
    { crop: 'Tomato', mandiPrice: 1900, onlinePrice: 2450, platform: 'AgriMart Online' },
    { crop: 'Soybean', mandiPrice: 4350, onlinePrice: 4980, platform: 'AgriMart Online' }
  ]
};

const fallbackBanks = [
  { id: 'sbi', name: 'State Bank of India', type: 'Public sector bank', schemes: [{ id: 'sbi-kcc', name: 'Kisan Credit Card', category: 'crop', interestRate: 7.0, maxAmount: 300000, tenureMonths: 12 }, { id: 'sbi-agri-term', name: 'SBI Agri Business Term Loan', category: 'business', interestRate: 9.5, maxAmount: 2000000, tenureMonths: 60 }] },
  { id: 'axis', name: 'Axis Bank', type: 'Private bank', schemes: [{ id: 'axis-kisan', name: 'Axis Kisan Power Loan', category: 'crop', interestRate: 8.5, maxAmount: 500000, tenureMonths: 24 }, { id: 'axis-agri-biz', name: 'Axis Agri Business Loan', category: 'business', interestRate: 11, maxAmount: 5000000, tenureMonths: 84 }] },
  { id: 'other', name: 'Other Banks (RRB / Cooperative)', type: 'Regional rural & cooperative banks', schemes: [{ id: 'other-crop', name: 'NABARD Refinanced Crop Loan', category: 'crop', interestRate: 7.0, maxAmount: 160000, tenureMonths: 12 }, { id: 'other-microbiz', name: 'Rural Micro-Business Loan', category: 'business', interestRate: 10.5, maxAmount: 1000000, tenureMonths: 48 }] }
];

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
  const [showAllPrices, setShowAllPrices] = useState(false);
  const [allPrices, setAllPrices] = useState([]);
  const [showWhy, setShowWhy] = useState(false);
  const [notifications, setNotifications] = useState([{ id: 'welcome', title: 'Buyer offer ready', detail: 'Review your verified buyer offer and choose to accept, decline, or counter.' }]);
  const [expandedBuyer, setExpandedBuyer] = useState('');
  const [showBuyerGuide, setShowBuyerGuide] = useState(false);
  const [farmerMode, setFarmerMode] = useState(false);
  const [banks, setBanks] = useState(fallbackBanks);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanCategory, setLoanCategory] = useState('crop');
  const [loanReceipt, setLoanReceipt] = useState(null);

  const loadDashboard = async () => {
    setLoading(true); setNotice('');
    try {
      const [prices, trend, forecast, recommendation, buyers, comparison] = await Promise.all([
        api.getPrices(filters.crop, filters.location), api.getTrend(filters.crop), api.getForecast(filters.crop), api.getRecommendation(filters), api.getBuyers(), api.getPriceComparison()
      ]);
      setData({ prices: prices.length ? prices : fallback.prices, trend, forecast, recommendation, buyers, comparison: comparison.length ? comparison : fallback.comparison });
    } catch { setData(fallback); setNotice('Demo data is active. Market prices, buyer offers and AI forecasts are simulated for this prototype.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { api.getBanks().then(setBanks).catch(() => setBanks(fallbackBanks)); }, []);

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
  const notify = (message, title = 'KisanSetu update') => { setNotice(message); setNotifications((current) => [{ id: `${Date.now()}-${title}`, title, detail: message }, ...current].slice(0, 5)); };
  const createLot = async (lot) => {
    try { const result = await api.createLot(lot); await refreshWorkflow(); notify(result.generatedOffer ? 'Crop lot published. It is now in My crop lots, with a matched buyer offer ready.' : 'Crop lot published successfully in My crop lots.', 'Crop lot published'); document.getElementById('crop-lots')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (error) { setNotice(error.message || 'Could not publish this crop lot.'); }
    setShowLotForm(false);
  };
  const acceptOffer = async (id) => { try { await api.acceptOffer(id); await refreshWorkflow(); notify('Offer accepted. Transaction and payment tracking have started.', 'Offer accepted'); } catch (error) { setNotice(error.message || 'Could not accept this offer.'); } };
  const respondToOffer = async (id, status) => {
    try {
      await api.respondToOffer(id, status, status === 'countered' ? counterPrice : undefined);
      await refreshWorkflow();
      setCounteringOffer(''); setCounterPrice('');
      notify(status === 'rejected' ? 'Offer declined. You can continue comparing verified buyers.' : 'Your counter-offer has been sent to the verified buyer for review.', status === 'rejected' ? 'Offer declined' : 'Counter-offer sent');
    } catch (error) { setNotice(error.message || 'Could not update this offer.'); }
  };
  const moveTransaction = async (transaction) => {
    const next = transaction.status === 'confirmed' ? 'pickup_scheduled' : transaction.status === 'pickup_scheduled' ? 'in_transit' : transaction.status === 'in_transit' ? 'delivered' : 'completed';
    try { await api.updateTransaction(transaction.id, next); await refreshWorkflow(); notify(`Transaction updated: ${next.replace('_', ' ')}.`, 'Transaction update'); } catch { setNotice('Could not update transaction status.'); }
  };
  const confirmPayment = async (transaction) => {
    try { await api.updateTransaction(transaction.id, transaction.status, 'paid'); await refreshWorkflow(); notify(`Payment of ${formatPrice(transaction.amount)} marked received. Demo reference: ${transaction.paymentReference || 'KisanSetu payment'}.`, 'Payment received'); } catch (error) { setNotice(error.message || 'Could not update payment status.'); }
  };
  const submitGrievance = async (event) => { event.preventDefault(); if (!grievanceText.trim()) return; try { await api.raiseGrievance(grievanceText); setGrievanceText(''); setNotice('Grievance raised successfully. Our support team will review it.'); } catch { setNotice('Could not raise grievance.'); } };
  const resetDemo = async () => { try { await api.resetDemo(); await refreshWorkflow(); setSelectedService(''); notify('Demo data reset. Your pending buyer offer is ready again.', 'Demo reset'); } catch { setNotice('Could not reset demo data.'); } };
  const toggleAllPrices = async () => {
    if (showAllPrices) { setShowAllPrices(false); return; }
    try { const prices = await api.getPrices(filters.crop); setAllPrices(prices); setShowAllPrices(true); setNotice(`Showing all available ${filters.crop} demo markets.`); } catch (error) { setNotice(error.message || 'Could not load all markets.'); }
  };
  const closeLot = async (id) => {
    try { await api.updateLot(id, { status: 'closed' }); await refreshWorkflow(); notify('Crop lot closed. It will no longer receive new offers.', 'Crop lot closed'); } catch (error) { setNotice(error.message || 'Could not close this crop lot.'); }
  };
  const deleteLot = async (id) => {
    if (!window.confirm('Delete this crop lot and its pending offers?')) return;
    try { await api.deleteLot(id); await refreshWorkflow(); notify('Crop lot and its pending offers were deleted.', 'Crop lot deleted'); } catch (error) { setNotice(error.message || 'Could not delete this crop lot.'); }
  };
  const downloadReceipt = (transaction) => {
    const receipt = `KISANSETU DEMO RECEIPT\n\nReference: ${transaction.paymentReference || 'Pending'}\nBuyer: ${transaction.buyerName || 'Verified buyer'}\nCrop lot: ${transaction.crop || 'Crop lot'}\nQuantity: ${transaction.quantity || '—'} quintals\nAmount: ${formatPrice(transaction.amount)}\nPayment status: ${transaction.paymentStatus}\nPayment method: ${transaction.paymentMethod || 'Demo payment'}\n\nThis is a hackathon-demo receipt, not a financial instrument.`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([receipt], { type: 'text/plain' })); link.download = `KisanSetu-${transaction.paymentReference || 'receipt'}.txt`; link.click(); URL.revokeObjectURL(link.href); notify('Demo receipt downloaded.', 'Receipt downloaded');
  };
  const submitLoanApplication = async (application) => {
    const receipt = await api.applyForLoan(application);
    setLoanReceipt(receipt);
    setShowLoanForm(false);
    notify(receipt.selectedBank ? `Loan application ${receipt.id} matched with ${receipt.selectedBank.name}.` : `Loan application ${receipt.id} submitted for manual review.`, 'Loan application submitted');
  };

  const navigateTo = (item) => {
    setActiveNav(item);
    const targetId = { Dashboard: 'dashboard', 'Market prices': 'market-prices', 'My crop lots': 'crop-lots', 'Buyer matches': 'buyer-matches', 'Smart Loan': 'smart-loan', Logistics: 'logistics', Transactions: 'transactions' }[item];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const bestMarket = [...data.prices].sort((a, b) => b.modalPrice - a.modalPrice)[0];
  const visiblePrices = showAllPrices && allPrices.length ? allPrices : data.prices;
  const pendingOfferCount = offers.filter((offer) => offer.status === 'pending').length;
  const navItems = [{ label: 'Dashboard', icon: Boxes }, { label: 'Market prices', icon: TrendingUp }, { label: 'My crop lots', icon: PackagePlus }, { label: 'Buyer matches', icon: Users }, { label: 'Smart Loan', icon: Landmark }, { label: 'Logistics', icon: Truck }, { label: 'Transactions', icon: CircleDollarSign }];
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><Leaf size={23}/></span><div><strong>KisanSetu</strong><small>Market intelligence</small></div></div><nav>{navItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={activeNav === label ? 'active' : ''} onClick={() => navigateTo(label)}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-footer"><div className="profile-avatar">SP</div><div><strong>Sanjay Patil</strong><small>Farmer · Nashik</small></div></div></aside>
    {mobileNavOpen && <div className="mobile-nav-layer"><button className="mobile-nav-backdrop" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}/><aside className="mobile-nav" aria-label="Mobile navigation"><div className="mobile-nav-head"><div className="brand"><span className="brand-mark"><Leaf size={21}/></span><div><strong>KisanSetu</strong><small>Market intelligence</small></div></div><button type="button" className="icon-button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>×</button></div><nav>{navItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={activeNav === label ? 'active' : ''} onClick={() => { navigateTo(label); setMobileNavOpen(false); }}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-footer"><div className="profile-avatar">SP</div><div><strong>Sanjay Patil</strong><small>Farmer · Nashik</small></div></div></aside></div>}
    <main id="dashboard"><header className="topbar"><button className="mobile-menu" aria-label="Open navigation menu" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu/></button><div><p className="eyebrow">GOOD MORNING, SANJAY <span className="demo-chip">DEMO DATA</span></p><h1>Make every harvest count.</h1></div><div className="top-actions"><button className="farmer-mode-button" onClick={() => setFarmerMode(!farmerMode)}>{farmerMode ? 'Standard text' : 'Farmer mode'}</button><div className="notification-wrap"><button className="notification" aria-label={`${notifications.length} notifications`} aria-expanded={showNotifications} onClick={() => setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.length > 0 && <i/>}</button>{showNotifications && <div className="notification-panel" role="status"><div className="notification-panel-head"><div><strong>Notifications</strong><small>{notifications.length} recent update{notifications.length === 1 ? '' : 's'}</small></div><button type="button" aria-label="Close notifications" onClick={() => setShowNotifications(false)}>×</button></div><div className="notification-list">{notifications.map((item) => <div className="notification-item" key={item.id}><span className="notification-dot"/><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div><button className="notification-review" type="button" onClick={() => { setShowNotifications(false); navigateTo('Transactions'); }}>Review active offers <ArrowRight size={14}/></button></div>}</div><button className="help-button" onClick={resetDemo}>Reset demo</button></div></header>
      <section className="hero-card"><div><p className="eyebrow">SELL SMARTER WITH KISANSETU</p><h2>Find the right buyer at the right time.</h2><p>Compare nearby mandi rates, receive verified buyer offers and know your best selling window.</p><button className="light-button" onClick={() => setShowLotForm(true)}>Create crop lot <ArrowRight size={18}/></button></div><div className="hero-art"><div className="sun"/><div className="hill hill-one"/><div className="hill hill-two"/><span>🌾</span></div></section>
      <section className="search-panel"><div className="search-title"><Sparkles size={20}/><span>Check your selling opportunity</span></div><label>Crop<select value={filters.crop} onChange={(event) => setFilters({ ...filters, crop: event.target.value })}><option>Onion</option><option>Tomato</option><option>Soybean</option></select></label><label>Location<input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}/></label><label>Quantity (q)<input type="number" value={filters.quantity} onChange={(event) => setFilters({ ...filters, quantity: event.target.value })}/></label><button className="primary-button" onClick={loadDashboard}>{loading ? 'Checking…' : 'Check prices'}</button></section>
      {notice && <div className="notice notice-toast" role="status" aria-live="polite"><span className="toast-icon"><CheckCircle2 size={18}/></span><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
      <section className="stats-grid"><StatCard label="Best mandi rate" value={formatPrice(bestMarket?.modalPrice || 0)} note={`${bestMarket?.mandiName || 'Nearby mandi'} · per quintal`}/><StatCard label="Predicted peak" value={formatPrice(data.forecast.predictedPeak)} note="Expected within the next 7 days" accent="amber"/><StatCard label="Verified buyer offer" value={formatPrice(data.recommendation.recommendedBuyer?.offerPrice || 0)} note={`${data.recommendation.recommendedBuyer?.name || 'No buyer'} · per quintal`} accent="blue"/><StatCard label="Your best net price" value={formatPrice(data.recommendation.expectedNetPrice)} note="After estimated logistics cost" accent="purple"/></section>
      <section className="two-column"><TrendChart data={data.trend}/><article className="recommendation"><div className="recommendation-icon"><Sparkles size={20}/></div><p className="eyebrow">SMART SELL / HOLD · DEMO AI PREDICTION</p><h3 className="recommendation-status">{data.recommendation.action === 'sell' ? 'Sell now' : 'Hold briefly'}</h3><h2 className="recommendation-message">{data.recommendation.decisionText || (data.recommendation.action === 'sell' ? `Sell now · ${formatPrice(data.forecast.currentPrice)}/q` : `Hold ${data.recommendation.daysToPeak || 1} days`)}</h2><p className="recommendation-price">{formatPrice(data.recommendation.expectedNetPrice)} <span>/ quintal net</span></p><div className="window"><TrendingUp size={18}/><div><strong>{data.recommendation.sellingWindow}</strong><small>Predicted from seeded historical data; not a live market guarantee.</small></div></div>{showWhy && <div className="why-panel"><span><small>Current price</small><strong>{formatPrice(data.forecast.currentPrice)}/q</strong></span><span><small>Forecast peak</small><strong>{formatPrice(data.forecast.predictedPeak)}/q</strong></span><span><small>Best net option</small><strong>{formatPrice(data.recommendation.expectedNetPrice)}/q</strong></span><p>{data.recommendation.reasons?.[0] || 'Ranks price, distance, quantity fit and reliability.'}</p></div>}<div className="recommendation-cta-row"><button className="why-button" onClick={() => setShowWhy(!showWhy)}>{showWhy ? 'Hide calculation' : 'Why this recommendation?'}</button><button className="secondary-button" onClick={() => setShowLotForm(true)}>Create a lot <ArrowRight size={17}/></button></div></article></section>
      <section id="market-prices" className="section-header"><div><p className="eyebrow">MARKET INTELLIGENCE · SIMULATED DATA</p><h2>{showAllPrices ? `All ${filters.crop} markets` : 'Nearby mandi prices'}</h2><small className="data-note">Sample mandi prices for this hackathon demo — replace with a Government market-data API before deployment.</small></div><button className="text-button" onClick={toggleAllPrices}>{showAllPrices ? 'Show nearby' : 'View all prices'} <ArrowRight size={16}/></button></section>
      <section className="table-card price-scroll"><div className="price-table header-row"><span>Mandi market</span><span>Distance</span><span>Modal price</span><span>Est. transport/q</span><span>Net /q</span></div>{visiblePrices.map((price, index) => { const transport = Math.round((price.distanceKm * 12) / Math.max(Number(filters.quantity), 1)); const net = price.modalPrice - transport; return <div className="price-table" key={price.id || price.mandiName}><div><strong>{price.mandiName}</strong><small>{price.district}, Maharashtra{index === 0 ? ' · Nearby' : ''}</small></div><span>{price.distanceKm} km</span><strong>{formatPrice(price.modalPrice)}</strong><span>{formatPrice(transport)}</span><strong>{formatPrice(net)}</strong></div>; })}</section>
      <PriceComparisonChart data={data.comparison}/>
      <section className="net-card"><div><p className="eyebrow">NET REALISATION COMPARISON · ESTIMATED</p><h3>Choose the option that leaves you with more</h3><p>Net price = selling price − estimated transport cost (₹12/km ÷ your lot quantity).</p></div><div className="net-options">{(data.recommendation.options || []).slice(0, 3).map((option) => <div key={`${option.type}-${option.name}`}><small>{option.type === 'buyer' ? 'Verified buyer' : 'Mandi'}</small><strong>{option.name}</strong><span>{formatPrice(option.netPrice)}/q net</span></div>)}</div></section>
      <section className="earnings-card"><div><p className="eyebrow">NET EARNINGS CALCULATOR · DEMO</p><h3>What you could receive from this lot</h3><small>Storage uses the demo rate of ₹18/q/day only when the model recommends holding.</small></div><div className="earnings-grid"><span><small>Lot quantity</small><strong>{filters.quantity} q</strong></span><span><small>Best net /q</small><strong>{formatPrice(data.recommendation.expectedNetPrice)}</strong></span><span><small>Storage estimate</small><strong>−{formatPrice(data.recommendation.action === 'hold' ? Number(filters.quantity) * 18 * (data.recommendation.daysToPeak || 0) : 0)}</strong></span><span><small>Platform fee</small><strong>₹0</strong></span><span className="earnings-total"><small>Estimated farmer payout</small><strong>{formatPrice((Number(filters.quantity) * Number(data.recommendation.expectedNetPrice)) - (data.recommendation.action === 'hold' ? Number(filters.quantity) * 18 * (data.recommendation.daysToPeak || 0) : 0))}</strong></span></div></section>
      <section id="crop-lots" className="section-header"><div><p className="eyebrow">YOUR PRODUCE</p><h2>My crop lots</h2><small className="data-note">Published lots are shown here. A buyer match is generated automatically for eligible demo lots.</small></div><button className="text-button" onClick={() => setShowLotForm(true)}>Create crop lot <PackagePlus size={16}/></button></section>
      <section className="lot-grid">{lots.length ? lots.map((lot) => { const matchCount = offers.filter((offer) => offer.lotId === lot.id && offer.status === 'pending').length; return <article className="lot-card" key={lot.id}><div className="lot-card-head"><div><span className="lot-status">{lot.status || 'open'}</span><h3>{lot.crop}</h3></div><span className="lot-quantity">{lot.quantity} q</span></div><div className="lot-meta"><span><small>Variety</small><strong>{lot.variety || 'Not specified'}</strong></span><span><small>Quality</small><strong>Grade {lot.grade}</strong></span><span><small>Asking price</small><strong>{formatPrice(lot.askingPrice)}/q</strong></span><span><small>Harvested</small><strong>{lot.harvestDate ? new Date(`${lot.harvestDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not specified'}</strong></span></div><p className="match-count">{matchCount ? `${matchCount} matching offer${matchCount === 1 ? '' : 's'} waiting` : lot.status === 'closed' ? 'Lot closed' : 'Finding buyer matches'}</p><div className="lot-actions"><button className="outline-button" onClick={() => document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Review offers <ArrowRight size={15}/></button>{lot.status !== 'closed' && <button className="close-lot-button" onClick={() => closeLot(lot.id)}>Close</button>}<button className="delete-lot-button" aria-label={`Delete ${lot.crop} crop lot`} onClick={() => deleteLot(lot.id)}><Trash2 size={14}/><span>Delete</span></button></div></article>; }) : <section className="empty-state"><PackagePlus size={21}/><div><strong>No crop lots published yet</strong><p>Create your first lot to start matching with buyers.</p></div><button className="outline-button" onClick={() => setShowLotForm(true)}>Create crop lot</button></section>}</section>
      <section id="buyer-matches" className="section-header"><div><p className="eyebrow">VERIFIED DEMAND · SIMULATED BUYER PROFILES</p><h2>Buyers matched for you</h2><small className="data-note">Demo offers and buyer verification status are simulated — clearly labelled for a responsible presentation.</small></div><button className="text-button" onClick={() => setShowBuyerGuide(!showBuyerGuide)}>{showBuyerGuide ? 'Hide ranking guide' : 'How buyers are ranked'} <ArrowRight size={16}/></button></section>
      {showBuyerGuide && <section className="buyer-guide"><strong>Match score formula</strong><span>Offer price 15%</span><span>Distance 15%</span><span>Quantity fit 30%</span><span>Grade 20%</span><span>Reliability 20%</span></section>}
      <section className="buyer-grid">{data.buyers.slice(0, 3).map((buyer, index) => { const transport = Math.round(((buyer.distanceKm || 0) * 12) / Math.max(Number(filters.quantity), 1)); const match = data.recommendation.options?.find((option) => option.type === 'buyer' && option.name === buyer.companyName); const score = match?.scoreBreakdown || {}; return <article className="buyer-card" key={buyer.id}><div className="buyer-top"><div className="buyer-logo">{buyer.companyName.slice(0, 1)}</div>{buyer.verified && <span className="verified"><ShieldCheck size={15}/> Rank #{index + 1} · Demo verified</span>}</div><h3>{buyer.companyName}</h3><p><MapPin size={15}/>{buyer.location} · Needs {buyer.requiredQuantity} q</p><div className="buyer-bottom"><div><small>Indicative offer</small><strong>{formatPrice(buyer.targetPrice)}/q</strong></div><div><small>Estimated net</small><strong>{formatPrice(buyer.targetPrice - transport)}/q</strong></div></div><div className="score-row"><span>Match score</span><strong>{match?.matchScore || '—'}%</strong><i><b style={{ width: `${match?.matchScore || 0}%` }}/></i></div>{expandedBuyer === buyer.id && <div className="score-breakdown"><span>Offer price <b>{score.offerPrice ?? '—'}/15</b></span><span>Distance <b>{score.distance ?? '—'}/15</b></span><span>Quantity fit <b>{score.quantityFit ?? '—'}/30</b></span><span>Grade <b>{score.grade ?? '—'}/20</b></span><span>Reliability <b>{score.reliability ?? '—'}/20</b></span></div>}<button className="outline-button" onClick={() => setExpandedBuyer(expandedBuyer === buyer.id ? '' : buyer.id)}>{expandedBuyer === buyer.id ? 'Hide match breakdown' : 'View match breakdown'}</button></article>; })}</section>
      <section id="smart-loan" className="section-header"><div><p className="eyebrow">FINANCE YOUR HARVEST</p><h2>Smart Loan</h2></div><button className="text-button" onClick={() => setShowLoanForm(true)}>Apply for a loan <ArrowRight size={16}/></button></section>
      <section className="bank-grid">{banks.map((bank) => {
        const cropScheme = bank.schemes.find((scheme) => scheme.category === 'crop') || bank.schemes[0];
        const businessScheme = bank.schemes.find((scheme) => scheme.category === 'business');
        return <article className="bank-card" key={bank.id}>
          <div className="bank-top"><div className="buyer-logo"><Landmark size={17}/></div><span className="verified"><ShieldCheck size={15}/> {bank.type}</span></div>
          <h3>{bank.name}</h3>
          <ul className="bank-schemes">
            {cropScheme && <li><span>{cropScheme.name}</span><strong>{cropScheme.interestRate}% p.a. · up to {formatPrice(cropScheme.maxAmount)}</strong></li>}
            {businessScheme && <li><span>{businessScheme.name}</span><strong>{businessScheme.interestRate}% p.a. · up to {formatPrice(businessScheme.maxAmount)}</strong></li>}
          </ul>
          <button className="outline-button" onClick={() => { setLoanCategory(cropScheme?.category || 'crop'); setShowLoanForm(true); }}>Check eligibility</button>
        </article>;
      })}</section>
      <article className="recommendation loan-recommendation"><div className="recommendation-icon"><Sparkles size={20}/></div><p className="eyebrow">BUSINESS/CROP-BASED RECOMMENDATION</p><h3>Not sure which loan fits?</h3><p>Tell us your crop or business, loan amount and income — we match you with the bank and scheme you are most likely to be eligible for.</p><button className="secondary-button" onClick={() => setShowLoanForm(true)}>Start loan application <ArrowRight size={17}/></button></article>
      <section id="logistics" className="section-header"><div><p className="eyebrow">MOVE AND STORE</p><h2>Logistics options</h2></div></section>
      <section className="service-grid">{(logistics.length ? logistics : [{ id: 'transport', provider: 'Kisan Haul', type: 'Transport', capacity: 150 }, { id: 'storage', provider: 'Nashik Cold Store', type: 'Storage', ratePerDay: 18 }]).map((service) => <article className="service-card" key={service.id}><Truck size={23}/><div><strong>{service.provider}</strong><p>{service.type} · {service.capacity ? `Capacity ${service.capacity} quintals` : `₹${service.ratePerDay} per quintal/day`}</p></div><button className="outline-button" onClick={() => { setSelectedService(service.provider); setNotice(`${service.provider} selected for your crop lot.`); }}>{selectedService === service.provider ? 'Selected' : 'Select'}</button></article>)}</section>
      {selectedService && <div className="logistics-confirmation" role="status"><Truck size={16}/><span><strong>{selectedService}</strong> is selected for your crop lot. It will appear in transaction tracking after you accept an offer.</span></div>}
      <section id="transactions" className="section-header"><div><p className="eyebrow">ORDER STATUS</p><h2>Transactions</h2></div></section>
      {offers.filter((offer) => offer.status === 'pending').map((offer) => <section className="transaction-card" key={offer.id}><div className="transaction-status">Demo buyer offer</div><div><strong>Crop lot · {offer.quantity} quintals</strong><p>Buyer offer: {formatPrice(offer.pricePerUnit)} per quintal · {offer.message}</p>{counteringOffer === offer.id && <div className="counter-row"><input aria-label="Counter-offer price" type="number" min="1" placeholder="Your ₹/q counter" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)}/><button className="outline-button" onClick={() => respondToOffer(offer.id, 'countered')}>Send counter</button></div>}</div><div className="offer-actions"><button className="outline-button" onClick={() => setCounteringOffer(counteringOffer === offer.id ? '' : offer.id)}>Counter</button><button className="outline-button" onClick={() => respondToOffer(offer.id, 'rejected')}>Decline</button><button className="primary-button" onClick={() => acceptOffer(offer.id)}>Accept offer</button></div></section>)}
      {offers.filter((offer) => offer.status === 'countered').map((offer) => <section className="transaction-card" key={offer.id}><div className="transaction-status">Counter sent</div><div><strong>Your counter-offer: {formatPrice(offer.counterPrice)}/q</strong><p>{offer.counterMessage} This is a simulated negotiation state for the demo.</p></div></section>)}
      {transactions.map((transaction) => <section className="transaction-card" key={transaction.id}><div className="transaction-status"><CheckCircle2 size={13}/> {transaction.paymentStatus.replaceAll('_', ' ')}</div><div><strong>{transaction.crop || 'Crop lot'} · {formatPrice(transaction.amount)}</strong><p>{transaction.buyerName || 'Verified buyer'} · {transaction.quantity || '—'} q · {transaction.status.replaceAll('_', ' ')}</p><small className="payment-detail">{transaction.pickupWindow || selectedService || 'Select logistics above'} · {transaction.driverName || 'Driver assigned after pickup'} · {transaction.driverPhone || 'Contact pending'}</small><small className="payment-detail">{transaction.paymentMethod || 'Demo payment'} · Ref: {transaction.paymentReference || 'Generated after acceptance'} · {transaction.paymentDue || 'Payment timing shown after acceptance'}</small><div className="transaction-steps"><span className={['pickup_scheduled', 'in_transit', 'delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>1. Pickup</span><span className={['in_transit', 'delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>2. Transit</span><span className={['delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>3. Delivery</span><span className={transaction.paymentStatus === 'paid' ? 'done' : ''}>4. Payment</span></div></div><div className="offer-actions">{transaction.status !== 'completed' && <button className="primary-button" onClick={() => moveTransaction(transaction)}><Clock3 size={16}/> Next step</button>}{['delivered', 'completed'].includes(transaction.status) && transaction.paymentStatus !== 'paid' && <button className="outline-button" onClick={() => confirmPayment(transaction)}>Confirm payment received</button>}<button className="quiet-button" onClick={() => downloadReceipt(transaction)}>Download receipt</button></div></section>)}
      {!offers.some((offer) => offer.status === 'pending') && !transactions.length && <section className="empty-state"><CheckCircle2 size={21}/><div><strong>No active offers yet</strong><p>Create a crop lot to start receiving buyer offers.</p></div></section>}
      <section className="support-card"><MessageSquareWarning size={22}/><div><p className="eyebrow">NEED HELP?</p><h3>Raise a grievance</h3><p>Report an offer, logistics, quality, or payment issue.</p></div><form onSubmit={submitGrievance}><input value={grievanceText} onChange={(event) => setGrievanceText(event.target.value)} aria-label="Describe your concern" placeholder="Describe your concern"/><button className="outline-button">Submit</button></form></section>
    </main>
    {showLotForm && <LotModal crop={filters.crop} onClose={() => setShowLotForm(false)} onSave={createLot}/>}
    {showLoanForm && <LoanModal defaultCrop={loanCategory === 'crop' ? filters.crop : ''} onClose={() => setShowLoanForm(false)} onSave={submitLoanApplication}/>}
    {loanReceipt && <LoanReceipt application={loanReceipt} onClose={() => setLoanReceipt(null)} onNewApplication={() => { setLoanReceipt(null); setShowLoanForm(true); }}/>}
  </div>;
}
