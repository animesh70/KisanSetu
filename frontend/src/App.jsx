import { useEffect, useState } from 'react';
import { ArrowRight, Bell, Boxes, CircleDollarSign, Leaf, MapPin, Menu, PackagePlus, ShieldCheck, Sparkles, TrendingUp, Truck, Users, CheckCircle2, Clock3, MessageSquareWarning, Trash2, Wrench } from 'lucide-react';
import { api } from './services/api';
import StatCard from './components/StatCard';
import TrendChart from './components/TrendChart';
import LotModal from './components/LotModal';
import KisanAssistant from './components/KisanAssistant';
import PochitaFollower from './components/PochitaFollower';
import EquipmentMarketplace from './components/EquipmentMarketplace.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_OPTIONS } from './i18n';
import { canUseSharedLogistics, sharedLogisticsStatusKey } from './services/sharedLogistics.js';

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
    { id: 'buyer-3', companyName: 'Green Basket Retail', location: 'Mumbai', reliabilityScore: 4.5, requiredQuantity: 50, targetPrice: 2550, verified: true },
    { id: 'buyer-4', companyName: 'Deccan Oil Mills', location: 'Akola', reliabilityScore: 4.7, requiredQuantity: 100, targetPrice: 4480, verified: true }
  ]
};

const hasNumber = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const firstNumber = (...values) => values.find(hasNumber);
function formatPrice(value) { return hasNumber(value) ? `₹${Number(value).toLocaleString('en-IN')}` : '—'; }
const MAX_LOT_QUANTITY = 5000;

const EQUIPMENT_DEMO_USERS = [
  { id: 'farmer-1', name: 'Sanjay Patil', location: 'Nashik' },
  { id: 'farmer-2', name: 'Mahesh Jadhav', location: 'Nashik' },
  { id: 'farmer-3', name: 'Asha More', location: 'Nashik' },
  { id: 'farmer-4', name: 'Ramesh Shinde', location: 'Pune' }
];
const EQUIPMENT_DEMO_USER_STORAGE_KEY = 'kisansetu-equipment-demo-user';
const NAV_SECTIONS = [
  { label: 'Dashboard', id: 'dashboard-overview' },
  { label: 'Market prices', id: 'market-prices' },
  { label: 'My crop lots', id: 'crop-lots' },
  { label: 'Buyer matches', id: 'buyer-matches' },
  { label: 'Logistics', id: 'logistics' },
  { label: 'Equipment sharing', id: 'equipment-sharing' },
  { label: 'Transactions', id: 'transactions' }
];
function initialEquipmentDemoUser() {
  if (typeof window === 'undefined') return 'farmer-1';
  const saved = window.localStorage.getItem(EQUIPMENT_DEMO_USER_STORAGE_KEY);
  return EQUIPMENT_DEMO_USERS.some((user) => user.id === saved) ? saved : 'farmer-1';
}
function profileInitials(name) {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SP';
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState({ crop: 'Onion', location: 'Nashik', quantity: 100, grade: 'A' });
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [showLotForm, setShowLotForm] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [offers, setOffers] = useState([]);
  const [lots, setLots] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [grievanceText, setGrievanceText] = useState('');
  const [counteringOffer, setCounteringOffer] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAllPrices, setShowAllPrices] = useState(false);
  const [allPrices, setAllPrices] = useState([]);
  const [showWhy, setShowWhy] = useState(false);
  const [notifications, setNotifications] = useState([{ id: 'welcome', titleKey: 'alerts.buyerReadyTitle', detailKey: 'alerts.buyerReadyDetail', params: {} }]);
  const [expandedBuyer, setExpandedBuyer] = useState('');
  const [showBuyerGuide, setShowBuyerGuide] = useState(false);
  const [farmerMode, setFarmerMode] = useState(false);
  const [kittyEnabled, setKittyEnabled] = useState(false);
  const [sharedLogisticsByLot, setSharedLogisticsByLot] = useState({});
  const [sharedLogisticsLoading, setSharedLogisticsLoading] = useState('');
  const [equipmentDemoUserId, setEquipmentDemoUserId] = useState(initialEquipmentDemoUser);
  const [equipmentResetVersion, setEquipmentResetVersion] = useState(0);

  const loadDashboard = async () => {
    const quantity = Number(filters.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LOT_QUANTITY) { setNotice({ key: 'alerts.quantityInvalid', params: {} }); return; }
    setLoading(true); setNotice(null);
    try {
      const [prices, trend, forecast, recommendation, buyers] = await Promise.all([
        api.getPrices(filters.crop, filters.location, quantity), api.getTrend(filters.crop), api.getForecast(filters.crop), api.getRecommendation(filters), api.getBuyers(filters.crop)
      ]);
      setData({ prices: prices.length ? prices : fallback.prices, trend, forecast, recommendation, buyers });
    } catch { setData(fallback); setNotice({ key: 'alerts.dataFallback', params: {} }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const refreshWorkflow = async () => {
    try {
      const [nextLots, nextOffers, nextTransactions, nextLogistics] = await Promise.all([api.getLots(), api.getOffers(), api.getTransactions(), api.getLogistics()]);
      setLots(nextLots); setOffers(nextOffers); setTransactions(nextTransactions); setLogistics(nextLogistics);
      const activeTransaction = nextTransactions.find((item) => item.status !== 'completed' && item.logisticsOptionId);
      const backendSelection = activeTransaction && nextLogistics.find((item) => item.id === activeTransaction.logisticsOptionId);
      if (backendSelection) setSelectedService(backendSelection);
    } catch { /* The dashboard still has market-data fallback for offline demo mode. */ }
  };
  useEffect(() => { refreshWorkflow(); }, []);
  useEffect(() => {
    let frame = 0;

    const syncActiveNavigation = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const probeY = window.scrollY + Math.min(220, window.innerHeight * 0.28);
        let nextActive = 'Dashboard';

        for (const section of NAV_SECTIONS) {
          const node = document.getElementById(section.id);
          if (!node) continue;
          const sectionTop = node.getBoundingClientRect().top + window.scrollY;
          if (sectionTop <= probeY) nextActive = section.label;
          else break;
        }

        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
          nextActive = 'Transactions';
        }

        setActiveNav((current) => current === nextActive ? current : nextActive);
      });
    };

    syncActiveNavigation();
    window.addEventListener('scroll', syncActiveNavigation, { passive: true });
    window.addEventListener('resize', syncActiveNavigation);
    return () => {
      window.removeEventListener('scroll', syncActiveNavigation);
      window.removeEventListener('resize', syncActiveNavigation);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  const showNotice = (key, params = {}) => setNotice({ key, params });
  const notify = (detailKey, titleKey = 'alerts.updateTitle', params = {}) => {
    showNotice(detailKey, params);
    setNotifications((current) => [{ id: `${Date.now()}-${titleKey}`, titleKey, detailKey, params }, ...current].slice(0, 5));
  };
  const createLot = async (lot) => {
    try { const result = await api.createLot(lot); await refreshWorkflow(); notify(result.generatedOffer ? 'alerts.lotPublishedMatch' : 'alerts.lotPublished', 'alerts.lotPublishedTitle'); document.getElementById('crop-lots')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch { showNotice('alerts.lotPublishFailed'); }
    setShowLotForm(false);
  };
  const acceptOffer = async (id) => { try { await api.acceptOffer(id, selectedService?.id); await refreshWorkflow(); notify(selectedService ? 'alerts.offerAcceptedLogistics' : 'alerts.offerAcceptedSelect', 'alerts.offerAcceptedTitle', { provider: selectedService?.provider }); } catch { showNotice('alerts.offerFailed'); } };
  const respondToOffer = async (id, status) => {
    try {
      await api.respondToOffer(id, status, status === 'countered' ? counterPrice : undefined);
      await refreshWorkflow();
      setCounteringOffer(''); setCounterPrice('');
      notify(status === 'rejected' ? 'alerts.offerDeclined' : 'alerts.counterSent', status === 'rejected' ? 'alerts.offerDeclinedTitle' : 'alerts.counterTitle');
    } catch { showNotice('alerts.offerUpdateFailed'); }
  };
  const moveTransaction = async (transaction) => {
    const next = transaction.status === 'confirmed' ? 'pickup_scheduled' : transaction.status === 'pickup_scheduled' ? 'in_transit' : transaction.status === 'in_transit' ? 'delivered' : 'completed';
    if (next === 'pickup_scheduled' && !transaction.logisticsOptionId) {
      showNotice('alerts.logisticsRequired');
      document.getElementById('logistics')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    try { await api.updateTransaction(transaction.id, next); await refreshWorkflow(); notify('alerts.transactionUpdated', 'alerts.transactionTitle', { status: next.replace('_', ' ') }); } catch { showNotice('alerts.transactionFailed'); }
  };
  const confirmPayment = async (transaction) => {
    try { await api.updateTransaction(transaction.id, transaction.status, 'paid'); await refreshWorkflow(); notify('alerts.paymentReceived', 'alerts.paymentTitle', { amount: formatPrice(transaction.amount) }); } catch { showNotice('alerts.paymentFailed'); }
  };
  const selectLogistics = async (service) => {
    if (!service?.id) { showNotice('alerts.logisticsInvalid'); return; }
    const activeTransaction = transactions.find((item) => item.status !== 'completed');
    try {
      if (activeTransaction) await api.selectTransactionLogistics(activeTransaction.id, service.id);
      setSelectedService(service);
      await refreshWorkflow();
      notify(activeTransaction ? 'alerts.logisticsUpdated' : 'alerts.logisticsFuture', 'alerts.logisticsTitle', { provider: service.provider });
    } catch { showNotice('alerts.logisticsFailed'); }
  };
  const submitGrievance = async (event) => { event.preventDefault(); if (!grievanceText.trim()) return; try { await api.raiseGrievance(grievanceText); setGrievanceText(''); showNotice('alerts.grievanceRaised'); } catch { showNotice('alerts.grievanceFailed'); } };
  const resetDemo = async () => {
    await i18n.changeLanguage('en');
    try {
      await api.resetDemo();
      await refreshWorkflow();
      setSelectedService(null);
      setSharedLogisticsByLot({});
      setEquipmentDemoUserId('farmer-1');
      window.localStorage.setItem(EQUIPMENT_DEMO_USER_STORAGE_KEY, 'farmer-1');
      setEquipmentResetVersion((current) => current + 1);
      notify('alerts.resetDone', 'alerts.resetTitle');
    } catch {
      showNotice('alerts.resetFailed');
    }
  };
  const toggleAllPrices = async () => {
    if (showAllPrices) { setShowAllPrices(false); return; }
    try { const prices = await api.getPrices(filters.crop, undefined, Number(filters.quantity)); setAllPrices(prices); setShowAllPrices(true); showNotice('alerts.marketsShown', { crop: cropLabel(filters.crop) }); } catch { showNotice('alerts.marketsFailed'); }
  };
  const closeLot = async (id) => {
    try { await api.updateLot(id, { status: 'closed' }); await refreshWorkflow(); notify('alerts.lotClosed', 'alerts.lotClosedTitle'); } catch { showNotice('alerts.lotCloseFailed'); }
  };
  const deleteLot = async (id) => {
    if (!window.confirm('Delete this crop lot and its pending offers?')) return;
    try { await api.deleteLot(id); await refreshWorkflow(); notify('alerts.lotDeleted', 'alerts.lotDeletedTitle'); } catch { showNotice('alerts.lotDeleteFailed'); }
  };
  const checkSharedLogistics = async (lotId) => {
    setSharedLogisticsLoading(lotId);
    try {
      const result = await api.getSharedLogistics(lotId, 15);
      setSharedLogisticsByLot((current) => ({ ...current, [lotId]: result }));
    } catch {
      setSharedLogisticsByLot((current) => ({ ...current, [lotId]: { error: true } }));
    } finally {
      setSharedLogisticsLoading('');
    }
  };
  const downloadReceipt = (transaction) => {
    const receipt = `KISANSETU DEMO RECEIPT\n\nReference: ${transaction.paymentReference || 'Pending'}\nBuyer: ${transaction.buyerName || 'Verified buyer'}\nCrop lot: ${transaction.crop || 'Crop lot'}\nQuantity: ${transaction.quantity || '—'} quintals\nAmount: ${formatPrice(transaction.amount)}\nPayment status: ${transaction.paymentStatus}\nPayment method: ${transaction.paymentMethod || 'Demo payment'}\n\nThis is a hackathon-demo receipt, not a financial instrument.`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([receipt], { type: 'text/plain' })); link.download = `KisanSetu-${transaction.paymentReference || 'receipt'}.txt`; link.click(); URL.revokeObjectURL(link.href); notify('alerts.receiptDownloaded', 'alerts.receiptTitle');
  };

  const navigateTo = (item) => {
    setActiveNav(item);
    const targetId = NAV_SECTIONS.find((section) => section.label === item)?.id;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentPrices = Array.isArray(data.prices) ? data.prices : [];
  const recommendationOptions = Array.isArray(data.recommendation?.options) ? data.recommendation.options : [];
  const marketOptionsByName = new Map(recommendationOptions.filter((option) => option?.type === 'mandi').map((option) => [option.name, option]));
  const buyerOptionsByName = new Map(recommendationOptions.filter((option) => option?.type === 'buyer').map((option) => [option.name, option]));
  const bestMarket = [...currentPrices].filter((price) => hasNumber(price.modalPrice)).sort((a, b) => Number(b.modalPrice) - Number(a.modalPrice))[0];
  const visiblePrices = showAllPrices && allPrices.length ? allPrices : currentPrices;
  const holdingCostTotal = firstNumber(data.recommendation?.holdingCostTotal, data.recommendation?.storageCostTotal);
  const holdingCostPerQuintal = firstNumber(data.recommendation?.holdingCostPerQuintal, data.recommendation?.storageCostPerQuintal);
  const estimatedPayout = firstNumber(data.recommendation?.estimatedPayout, data.recommendation?.estimatedNetAmount, data.recommendation?.netPayable);
  const pendingOfferCount = offers.filter((offer) => offer.status === 'pending').length;
  const cropLabel = (crop) => t(`crops.${String(crop || '').toLowerCase()}`, { defaultValue: crop });
  const navItems = [{ label: 'Dashboard', text: t('nav.dashboard'), icon: Boxes }, { label: 'Market prices', text: t('nav.markets'), icon: TrendingUp }, { label: 'My crop lots', text: t('nav.lots'), icon: PackagePlus }, { label: 'Buyer matches', text: t('nav.buyers'), icon: Users }, { label: 'Logistics', text: t('nav.logistics'), icon: Truck }, { label: 'Equipment sharing', text: t('nav.equipment'), icon: Wrench }, { label: 'Transactions', text: t('nav.transactions'), icon: CircleDollarSign }];
  const equipmentDemoUser = EQUIPMENT_DEMO_USERS.find((user) => user.id === equipmentDemoUserId) || EQUIPMENT_DEMO_USERS[0];
  const changeEquipmentDemoUser = (nextUserId) => {
    if (!EQUIPMENT_DEMO_USERS.some((user) => user.id === nextUserId)) return;
    setEquipmentDemoUserId(nextUserId);
    window.localStorage.setItem(EQUIPMENT_DEMO_USER_STORAGE_KEY, nextUserId);
  };
  const demoAccountFooter = <div className="sidebar-footer sidebar-account-switcher">
    <div className="profile-avatar">{profileInitials(equipmentDemoUser.name)}</div>
    <div className="sidebar-account-copy">
      <select className="sidebar-account-select" value={equipmentDemoUserId} onChange={(event) => changeEquipmentDemoUser(event.target.value)} aria-label={t('equipment.switchUser')} title={t('equipment.switchUser')}>
        {EQUIPMENT_DEMO_USERS.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
      </select>
      <small>{t('page.farmer')} · {equipmentDemoUser.location}</small>
    </div>
  </div>;
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><Leaf size={23}/></span><div><strong>KisanSetu</strong><small>{t('brandSubtitle')}</small></div></div><nav>{navItems.map(({ label, text, icon: Icon }) => <button type="button" key={label} className={activeNav === label ? 'active' : ''} aria-current={activeNav === label ? 'page' : undefined} onClick={() => navigateTo(label)}><Icon size={19}/>{text}</button>)}</nav>{demoAccountFooter}</aside>
    {mobileNavOpen && <div className="mobile-nav-layer"><button className="mobile-nav-backdrop" aria-label={t('page.close')} onClick={() => setMobileNavOpen(false)}/><aside className="mobile-nav" aria-label={t('nav.dashboard')}><div className="mobile-nav-head"><div className="brand"><span className="brand-mark"><Leaf size={21}/></span><div><strong>KisanSetu</strong><small>{t('brandSubtitle')}</small></div></div><button type="button" className="icon-button" aria-label={t('page.close')} onClick={() => setMobileNavOpen(false)}>×</button></div><nav>{navItems.map(({ label, text, icon: Icon }) => <button type="button" key={label} className={activeNav === label ? 'active' : ''} aria-current={activeNav === label ? 'page' : undefined} onClick={() => { navigateTo(label); setMobileNavOpen(false); }}><Icon size={19}/>{text}</button>)}</nav>{demoAccountFooter}</aside></div>}
    <main id="dashboard"><div className="main-content-inner"><header id="dashboard-overview" className="topbar"><button className="mobile-menu" aria-label={t('nav.dashboard')} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu/></button><div><p className="eyebrow">{t('greeting')} <span className="demo-chip">{t('page.demoData')}</span></p><h1>{t('headline')}</h1></div><div className="top-actions"><select className="language-select" value={i18n.language} onChange={(event) => i18n.changeLanguage(event.target.value)} aria-label={t('page.language')}>{LANGUAGE_OPTIONS.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}</select><button className="farmer-mode-button" onClick={() => setFarmerMode(!farmerMode)}>{farmerMode ? t('page.standardText') : t('page.farmerMode')}</button><div className="notification-wrap"><button className="notification" aria-label={`${notifications.length} ${t('page.notifications')}`} aria-expanded={showNotifications} onClick={() => setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.length > 0 && <i/>}</button>{showNotifications && <div className="notification-panel" role="status"><div className="notification-panel-head"><div><strong>{t('page.notifications')}</strong><small>{t('page.recentUpdates', { count: notifications.length })}</small></div><button type="button" aria-label={t('page.closeNotifications')} onClick={() => setShowNotifications(false)}>×</button></div><div className="notification-list">{notifications.map((item) => <div className="notification-item" key={item.id}><span className="notification-dot"/><div><strong>{t(item.titleKey, item.params)}</strong><p>{t(item.detailKey, item.params)}</p></div></div>)}</div><button className="notification-review" type="button" onClick={() => { setShowNotifications(false); navigateTo('Transactions'); }}>{t('page.reviewOffers')} <ArrowRight size={14}/></button></div>}</div><button className="help-button" onClick={resetDemo}>{t('reset')}</button></div></header>
      <section className="hero-card"><div className="hero-copy"><p className="eyebrow">{t('heroEyebrow')}</p><h2>{t('heroTitle')}</h2><p>{t('heroBody')}</p><button className="light-button" onClick={() => setShowLotForm(true)}>{t('createLot')} <ArrowRight size={18}/></button></div></section>
      <section className="search-panel"><div className="search-title"><Sparkles size={20}/><span>{t('opportunity')}</span></div><label>{t('crop')}<select value={filters.crop} onChange={(event) => setFilters({ ...filters, crop: event.target.value })}><option value="Onion">{t('crops.onion')}</option><option value="Tomato">{t('crops.tomato')}</option><option value="Soybean">{t('crops.soybean')}</option></select></label><label>{t('location')}<input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}/></label><label>{t('quantity')}<input type="number" value={filters.quantity} onChange={(event) => setFilters({ ...filters, quantity: event.target.value })}/></label><button className="primary-button" onClick={loadDashboard}>{loading ? t('checking') : t('checkPrices')}</button></section>
      {notice && <div className="notice notice-toast" role="status" aria-live="polite"><span className="toast-icon"><CheckCircle2 size={18}/></span><span>{t(notice.key, notice.params)}</span><button type="button" aria-label={t('page.dismiss')} onClick={() => setNotice(null)}>×</button></div>}
      <section className="stats-grid"><StatCard label={t('page.bestMandiRate')} value={formatPrice(bestMarket?.modalPrice)} note={`${bestMarket?.mandiName || t('page.nearbyMandi')} · ${t('page.perQuintal')}`}/><StatCard label={t('page.predictedPeak')} value={formatPrice(data.forecast?.predictedPeak)} note={t('page.expectedSevenDays')} accent="amber"/><StatCard label={t('page.verifiedBuyerOffer')} value={formatPrice(data.recommendation?.recommendedBuyer?.offerPrice)} note={`${data.recommendation?.recommendedBuyer?.name || t('page.noBuyer')} · ${t('page.perQuintal')}`} accent="blue"/><StatCard label={t('page.bestNetPrice')} value={formatPrice(data.recommendation?.expectedNetPrice)} note={t('page.afterLogistics')} accent="purple"/></section>
      <section className="two-column"><TrendChart data={data.trend}/><article className="recommendation"><div className="recommendation-icon"><Sparkles size={20}/></div><p className="eyebrow">{t('page.smartPrediction')}</p><h3 className="recommendation-status">{data.recommendation?.action === 'sell' ? t('page.sellNow') : t('page.holdBriefly')}</h3><h2 className="recommendation-message">{t(data.recommendation?.action === 'sell' ? 'page.sellDecision' : 'page.holdDecision', { days: data.recommendation?.daysToPeak || 1 })}</h2><p className="recommendation-price">{formatPrice(data.recommendation?.expectedNetPrice)} <span>/ {t('page.perQuintalNet')}</span></p><div className="window"><TrendingUp size={18}/><div><strong>{t(data.recommendation?.action === 'sell' ? 'page.sellReason' : 'page.holdReason')}</strong><small>{t('page.forecastDisclaimer')}</small></div></div>{showWhy && <div className="why-panel"><span><small>{t('page.currentPrice')}</small><strong>{formatPrice(data.forecast?.currentPrice)}/q</strong></span><span><small>{t('page.forecastPeak')}</small><strong>{formatPrice(data.forecast?.predictedPeak)}/q</strong></span><span><small>{t('page.bestNetOption')}</small><strong>{formatPrice(data.recommendation?.expectedNetPrice)}/q</strong></span><p>{t('page.rankingReason')}</p></div>}<div className="recommendation-cta-row"><button className="why-button" onClick={() => setShowWhy(!showWhy)}>{showWhy ? t('page.hideCalculation') : t('page.whyRecommendation')}</button><button className="secondary-button" onClick={() => setShowLotForm(true)}>{t('page.createALot')} <ArrowRight size={17}/></button></div></article></section>
      <section id="market-prices" className="section-header"><div><p className="eyebrow">{t('page.marketIntelligence')}</p><h2>{showAllPrices ? t('page.allMarkets', { crop: cropLabel(filters.crop) }) : t('page.nearbyPrices')}</h2><small className="data-note">{t('page.marketDataNote')}</small></div><button className="text-button" onClick={toggleAllPrices}>{showAllPrices ? t('page.showNearby') : t('page.viewAllPrices')} <ArrowRight size={16}/></button></section>
      <section className="table-card price-scroll"><div className="price-table header-row"><span>{t('page.mandiMarket')}</span><span>{t('page.distance')}</span><span>{t('page.modalPrice')}</span><span>{t('page.estimatedTransport')}</span><span>{t('page.netPerQuintal')}</span></div>{visiblePrices.map((price, index) => { const backendOption = marketOptionsByName.get(price.mandiName); const transport = firstNumber(backendOption?.estimatedLogisticsCost, price.estimatedLogisticsCost, price.transportCost); const net = firstNumber(backendOption?.netPrice, price.netPrice, price.netRealisation); return <div className="price-table" key={price.id || price.mandiName}><div><strong>{price.mandiName}</strong><small>{price.district}, Maharashtra{index === 0 ? ` · ${t('page.nearby')}` : ''}</small></div><span>{price.distanceKm} km</span><strong>{formatPrice(price.modalPrice)}</strong><span>{formatPrice(transport)}</span><strong>{formatPrice(net)}</strong></div>; })}</section>
      <section className="net-card"><div><p className="eyebrow">{t('page.netComparison')}</p><h3>{t('page.chooseMore')}</h3><p>{t('page.netDescription')}</p></div><div className="net-options">{recommendationOptions.slice(0, 3).map((option) => <div key={`${option.type}-${option.name}`}><small>{option.type === 'buyer' ? t('page.verifiedBuyer') : t('page.mandi')}</small><strong>{option.name}</strong><span>{formatPrice(option.netPrice)}/q {t('page.net')}</span></div>)}</div></section>
      <section className="earnings-card"><div><p className="eyebrow">{t('page.earningsCalculator')}</p><h3>{t('page.receiveLot')}</h3><small>{t('page.earningsDescription')}</small></div><div className="earnings-grid"><span><small>{t('page.lotQuantity')}</small><strong>{filters.quantity} q</strong></span><span><small>{t('page.bestNet')}</small><strong>{formatPrice(data.recommendation?.expectedNetPrice)}</strong></span><span><small>{t('page.storageEstimate')}</small><strong>{hasNumber(holdingCostTotal) ? `−${formatPrice(holdingCostTotal)}` : hasNumber(holdingCostPerQuintal) ? `${formatPrice(holdingCostPerQuintal)}/q` : t('page.includedInNet')}</strong></span><span><small>{t('page.platformFee')}</small><strong>{formatPrice(firstNumber(data.recommendation?.platformFee, 0))}</strong></span><span className="earnings-total"><small>{t('page.farmerPayout')}</small><strong>{formatPrice(estimatedPayout)}</strong></span></div></section>
      <section id="crop-lots" className="section-header"><div><p className="eyebrow">{t('page.yourProduce')}</p><h2>{t('page.lotsTitle')}</h2><small className="data-note">{t('page.lotsDescription')}</small></div><button className="text-button" onClick={() => setShowLotForm(true)}>{t('page.createCropLot')} <PackagePlus size={16}/></button></section>
      <section className="lot-grid">{lots.length ? lots.map((lot) => {
        const matchCount = offers.filter((offer) => offer.lotId === lot.id && offer.status === 'pending').length;
        const shared = sharedLogisticsByLot[lot.id];
        const sharedStatus = shared?.error ? 'unavailable' : shared ? sharedLogisticsStatusKey(shared) : '';
        return <article className="lot-card" key={lot.id}>
          <div className="lot-card-head"><div><span className="lot-status">{lot.status === 'closed' ? t('page.closed') : t('page.open')}</span><h3>{lot.crop}</h3></div><span className="lot-quantity">{lot.quantity} q</span></div>
          <div className="lot-meta"><span><small>{t('page.variety')}</small><strong>{lot.variety || t('page.notSpecified')}</strong></span><span><small>{t('page.quality')}</small><strong>{t('page.grade')} {lot.grade}</strong></span><span><small>{t('page.askingPrice')}</small><strong>{formatPrice(lot.askingPrice)}/q</strong></span><span><small>{t('page.harvested')}</small><strong>{lot.harvestDate ? new Date(`${lot.harvestDate}T00:00:00`).toLocaleDateString(LANGUAGE_OPTIONS.find((item) => item.code === i18n.language)?.locale || 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : t('page.notSpecified')}</strong></span></div>
          {lot.destinationMandiName && <p className="lot-destination"><MapPin size={14}/> {t('sharedLogistics.sameMandi')}: <strong>{lot.destinationMandiName}</strong></p>}
          <p className="match-count">{matchCount ? t('page.matchingOffers', { count: matchCount }) : lot.status === 'closed' ? t('page.lotClosed') : t('page.findingMatches')}</p>
          <div className="lot-actions">
            <button className="outline-button" onClick={() => document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{t('page.review')} <ArrowRight size={15}/></button>
            {canUseSharedLogistics(lot) && <button className="outline-button shared-freight-button" disabled={sharedLogisticsLoading === lot.id} onClick={() => checkSharedLogistics(lot.id)}><Truck size={15}/>{sharedLogisticsLoading === lot.id ? t('sharedLogistics.loading') : t('sharedLogistics.sharedFreight')}</button>}
            {lot.status !== 'closed' && <button className="close-lot-button" onClick={() => closeLot(lot.id)}>{t('page.close')}</button>}
            <button className="delete-lot-button" aria-label={t('page.delete')} onClick={() => deleteLot(lot.id)}><Trash2 size={14}/><span>{t('page.delete')}</span></button>
          </div>
          {shared && <div className={`shared-logistics-panel ${sharedStatus === 'available' ? 'is-saving' : ''}`} role="status">
            <div className="shared-logistics-head"><Truck size={17}/><strong>{t(`sharedLogistics.${sharedStatus}`)}</strong></div>
            {!shared.error && shared.eligible && <>
              <p>{t('sharedLogistics.withinKm', { radius: shared.radiusKm || 15 })} · {t('sharedLogistics.nearbyLots', { count: shared.nearbyLotCount || 0 })}</p>
              {shared.destinationMandi?.name && <p>{t('sharedLogistics.destinationMandi')}: <strong>{shared.destinationMandi.name}</strong></p>}
              {shared.group && shared.nearbyLotCount > 0 && <div className="shared-logistics-metrics">
                <span><small>{t('sharedLogistics.totalQuantity')}</small><strong>{shared.group.totalQuantity} q</strong></span>
                <span><small>{t('sharedLogistics.estimatedSaving')}</small><strong>{formatPrice(shared.group.estimatedSavings)}</strong></span>
                <span><small>{t('sharedLogistics.yourSaving')}</small><strong>{formatPrice(shared.group.requestingLotSavings)}</strong></span>
              </div>}
            </>}
          </div>}
        </article>;
      }) : <section className="empty-state"><PackagePlus size={21}/><div><strong>{t('page.noLots')}</strong><p>{t('page.noLotsDescription')}</p></div><button className="outline-button" onClick={() => setShowLotForm(true)}>{t('page.createCropLot')}</button></section>}</section>
      <section id="buyer-matches" className="section-header"><div><p className="eyebrow">{t('page.verifiedDemand')}</p><h2>{t('page.buyersMatched')}</h2><small className="data-note">{t('page.buyersNote')}</small></div><button className="text-button" onClick={() => setShowBuyerGuide(!showBuyerGuide)}>{showBuyerGuide ? t('page.hideRanking') : t('page.rankingGuide')} <ArrowRight size={16}/></button></section>
      {showBuyerGuide && <section className="buyer-guide"><strong>{t('page.matchFormula')}</strong><span>{t('page.offerPrice')} 15%</span><span>{t('page.distance')} 15%</span><span>{t('page.quantityFit')} 30%</span><span>{t('page.grade')} 20%</span><span>{t('page.reliability')} 20%</span></section>}
      <section className="buyer-grid">{(Array.isArray(data.buyers) ? data.buyers : []).slice(0, 3).map((buyer, index) => { const match = buyerOptionsByName.get(buyer.companyName); const score = match?.scoreBreakdown || {}; const estimatedNet = firstNumber(match?.estimatedNetPrice, match?.netPrice, buyer.estimatedNetPrice, buyer.netPrice); const matchScore = firstNumber(match?.matchScore, buyer.matchScore); return <article className="buyer-card" key={buyer.id}><div className="buyer-top"><div className="buyer-logo">{buyer.companyName.slice(0, 1)}</div>{buyer.verified && <span className="verified"><ShieldCheck size={15}/> {t('page.rank')} #{index + 1} · {t('page.demoVerified')}</span>}</div><h3>{buyer.companyName}</h3><p><MapPin size={15}/>{buyer.location} · {t('page.needs')} {buyer.requiredQuantity} q</p><div className="buyer-bottom"><div><small>{t('page.indicativeOffer')}</small><strong>{formatPrice(buyer.targetPrice)}/q</strong></div><div><small>{t('page.estimatedNet')}</small><strong>{formatPrice(estimatedNet)}/q</strong></div></div><div className="score-row"><span>{t('page.matchScore')}</span><strong>{hasNumber(matchScore) ? `${matchScore}%` : '—'}</strong><i><b style={{ width: `${hasNumber(matchScore) ? matchScore : 0}%` }}/></i></div>{expandedBuyer === buyer.id && <div className="score-breakdown"><span>{t('page.offerPrice')} <b>{score.offerPrice ?? '—'}/15</b></span><span>{t('page.distance')} <b>{score.distance ?? '—'}/15</b></span><span>{t('page.quantityFit')} <b>{score.quantityFit ?? '—'}/30</b></span><span>{t('page.grade')} <b>{score.grade ?? '—'}/20</b></span><span>{t('page.reliability')} <b>{score.reliability ?? '—'}/20</b></span></div>}<button className="outline-button" onClick={() => setExpandedBuyer(expandedBuyer === buyer.id ? '' : buyer.id)}>{expandedBuyer === buyer.id ? t('page.hideBreakdown') : t('page.viewBreakdown')}</button></article>; })}</section>
      <section id="logistics" className="section-header"><div><p className="eyebrow">{t('page.moveStore')}</p><h2>{t('page.logisticsOptions')}</h2></div></section>
      <section className="service-grid">{(logistics.length ? logistics : [{ id: 'transport', provider: 'Kisan Haul', type: 'Transport', capacity: 150 }, { id: 'storage', provider: 'Nashik Cold Store', type: 'Storage', ratePerDay: 18 }]).map((service) => <article className="service-card" key={service.id}><Truck size={23}/><div><strong>{service.provider}</strong><p>{service.type === 'Storage' ? t('page.storage') : t('page.transport')} · {service.capacity ? `${t('page.capacity')} ${service.capacity} ${t('page.quintals')}` : `₹${service.ratePerDay} ${t('page.perDay')}`}</p></div><button className="outline-button" onClick={() => selectLogistics(service)}>{selectedService?.id === service.id ? t('page.selected') : t('page.select')}</button></article>)}</section>
      {selectedService && <div className="logistics-confirmation" role="status"><Truck size={16}/><span>{t('page.selectedConfirmation', { provider: selectedService.provider })}</span></div>}
      <EquipmentMarketplace demoUserId={equipmentDemoUserId} resetVersion={equipmentResetVersion}/>
      <section id="transactions" className="section-header"><div><p className="eyebrow">{t('page.orderStatus')}</p><h2>{t('page.transactions')}</h2></div></section>
      {offers.filter((offer) => offer.status === 'pending').map((offer) => <section className="transaction-card" key={offer.id}><div className="transaction-status">{t('page.demoBuyerOffer')}</div><div><strong>{t('page.cropLot')} · {offer.quantity} {t('page.quintals')}</strong><p>{t('page.buyerOffer')}: {formatPrice(offer.pricePerUnit)} {t('page.perQuintal')} · {t('page.pickupAvailable')}</p>{counteringOffer === offer.id && <div className="counter-row"><input aria-label={t('page.counter')} type="number" min="1" placeholder="₹/q" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)}/><button className="outline-button" onClick={() => respondToOffer(offer.id, 'countered')}>{t('page.sendCounter')}</button></div>}</div><div className="offer-actions"><button className="outline-button" onClick={() => setCounteringOffer(counteringOffer === offer.id ? '' : offer.id)}>{t('page.counter')}</button><button className="outline-button" onClick={() => respondToOffer(offer.id, 'rejected')}>{t('page.decline')}</button><button className="primary-button" onClick={() => acceptOffer(offer.id)}>{t('page.acceptOffer')}</button></div></section>)}
      {offers.filter((offer) => offer.status === 'countered').map((offer) => <section className="transaction-card" key={offer.id}><div className="transaction-status">{t('page.counterSent')}</div><div><strong>{t('page.counter')}: {formatPrice(offer.counterPrice)}/q</strong><p>{offer.counterMessage}</p></div></section>)}
      {transactions.map((transaction) => <section className="transaction-card" key={transaction.id}><div className="transaction-status"><CheckCircle2 size={13}/> {t('page.payment')}</div><div><strong>{transaction.crop || t('page.cropLot')} · {formatPrice(transaction.amount)}</strong><p>{transaction.buyerName || t('page.verifiedBuyer')} · {transaction.quantity || '—'} q</p><small className="payment-detail">{transaction.pickupWindow || transaction.logisticsProvider || t('page.logisticsOptions')} · {transaction.driverName || t('page.pickup')}</small><small className="payment-detail">{transaction.paymentMethod || t('page.payment')} · Ref: {transaction.paymentReference || '—'} · {transaction.paymentDue || '—'}</small><div className="transaction-steps"><span className={['pickup_scheduled', 'in_transit', 'delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>1. {t('page.pickup')}</span><span className={['in_transit', 'delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>2. {t('page.transit')}</span><span className={['delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>3. {t('page.delivery')}</span><span className={transaction.paymentStatus === 'paid' ? 'done' : ''}>4. {t('page.payment')}</span></div></div><div className="offer-actions">{transaction.status !== 'completed' && <button className="primary-button" onClick={() => moveTransaction(transaction)}><Clock3 size={16}/> {t('page.nextStep')}</button>}{['delivered', 'completed'].includes(transaction.status) && transaction.paymentStatus !== 'paid' && <button className="outline-button" onClick={() => confirmPayment(transaction)}>{t('page.confirmPayment')}</button>}<button className="quiet-button" onClick={() => downloadReceipt(transaction)}>{t('page.downloadReceipt')}</button></div></section>)}
      {!offers.some((offer) => offer.status === 'pending') && !transactions.length && <section className="empty-state"><CheckCircle2 size={21}/><div><strong>{t('page.noOffers')}</strong><p>{t('page.noOffersDescription')}</p></div></section>}
      <section className="support-card"><MessageSquareWarning size={22}/><div><p className="eyebrow">{t('page.needHelp')}</p><h3>{t('page.raiseGrievance')}</h3><p>{t('page.reportIssue')}</p></div><form onSubmit={submitGrievance}><input value={grievanceText} onChange={(event) => setGrievanceText(event.target.value)} aria-label={t('page.describeConcern')} placeholder={t('page.describeConcern')}/><button className="outline-button">{t('page.submit')}</button></form></section>
      </div>
      <SiteFooter onNavigate={navigateTo}/>
    </main>
    {showLotForm && <LotModal crop={filters.crop} markets={currentPrices} onClose={() => setShowLotForm(false)} onSave={createLot}/>}
    <KisanAssistant
      context={{ filters, data, lots, offers, transactions, logistics, selectedService, equipmentDemoUserId, equipmentDemoUserName: equipmentDemoUser.name, resetVersion: equipmentResetVersion }}
      kittyEnabled={kittyEnabled}
      onKittyCommand={(command) => setKittyEnabled(command === 'on')}
      onAction={(key) => {
        if (key === 'create-lot') {
          setShowLotForm(true);
          return;
        }
        if (key === 'market') {
          navigateTo('Market prices');
          return;
        }
        if (key === 'offers' || key === 'transactions') {
          navigateTo('Transactions');
          return;
        }
        if (key === 'logistics') {
          navigateTo('Logistics');
          return;
        }
        if (key === 'equipment') {
          navigateTo('Equipment sharing');
          return;
        }
        document.querySelector('.recommendation')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }}
    />
    {kittyEnabled && <PochitaFollower />}
  </div>;
}
