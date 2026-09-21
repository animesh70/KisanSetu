import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, IndianRupee, LockKeyhole, PackageCheck, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { api } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import MarketplaceListingsLoader from './MarketplaceListingsLoader.jsx';

const DEMO_BUYERS = [
  { id: 'buyer-1', name: 'FreshMart Foods' },
  { id: 'buyer-2', name: 'MahaAgro Exports' },
  { id: 'buyer-3', name: 'Green Basket Retail' },
  { id: 'buyer-4', name: 'Deccan Oil Mills' }
];

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `₹${number.toLocaleString('en-IN')}` : '—';
}

async function loadRazorpayCheckout() {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function DirectMarketplace({ onChanged, refreshToken = '' }) {
  const { t, i18n } = useTranslation();
  const [listings, setListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [buyerId, setBuyerId] = useState('buyer-1');
  const [crop, setCrop] = useState('All');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [otpByTransaction, setOtpByTransaction] = useState({});
  const [qualityByTransaction, setQualityByTransaction] = useState({});

  const buyerName = DEMO_BUYERS.find((buyer) => buyer.id === buyerId)?.name || buyerId;
  const feePercent = listings[0]?.escrow?.platformFeePercent || purchases[0]?.platformFeePercent || 1.5;

  const refresh = async () => {
    setLoading(true);
    try {
      const [nextListings, nextPurchases] = await Promise.all([
        api.getMarketplaceListings(),
        api.getMarketplacePurchases(buyerId)
      ]);
      setListings(nextListings);
      setPurchases(nextPurchases);
    } catch (error) {
      setNotice(error.message || t('marketplace.dataLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [buyerId, refreshToken]);

  const visibleListings = useMemo(() => listings.filter((listing) => crop === 'All' || listing.crop === crop), [listings, crop]);
  const crops = useMemo(() => ['All', ...new Set(listings.map((listing) => listing.crop))], [listings]);

  const launchRazorpay = async (checkout) => {
    const ready = await loadRazorpayCheckout();
    if (!ready) throw new Error(t('marketplace.razorpayLoadFailed'));
    return new Promise((resolve, reject) => {
      const instance = new window.Razorpay({
        key: checkout.payment.razorpayKeyId,
        amount: checkout.payment.amountPaise,
        currency: 'INR',
        name: 'KisanSetu',
        description: `Secure crop purchase · ${checkout.transaction.crop}`,
        order_id: checkout.payment.orderId,
        handler: async (response) => {
          try {
            await api.verifyMarketplacePayment(response, buyerId);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: { ondismiss: () => reject(new Error(t('marketplace.paymentClosed'))) },
        theme: { color: '#157347' }
      });
      instance.open();
    });
  };

  const buyListing = async (listing) => {
    setBusy(listing.id);
    setNotice('');
    try {
      const checkout = await api.checkoutMarketplaceListing(listing.id, listing.quantity, buyerId);
      if (checkout.payment.provider === 'razorpay') await launchRazorpay(checkout);
      setNotice(checkout.payment.provider === 'demo'
        ? t('marketplace.demoFunded')
        : t('marketplace.paymentFunded'));
      await refresh();
      onChanged?.();
    } catch (error) {
      setNotice(error.message || t('marketplace.secureCheckoutFailed'));
    } finally {
      setBusy('');
    }
  };

  const fundExistingEscrow = async (transaction) => {
    setBusy(transaction.id);
    setNotice('');
    try {
      const payment = await api.getEscrowPaymentSession(transaction.id, buyerId);
      await launchRazorpay({ transaction, payment });
      setNotice(t('marketplace.paymentFunded'));
      await refresh();
      onChanged?.();
    } catch (error) {
      setNotice(error.message || t('marketplace.escrowFundingFailed'));
    } finally {
      setBusy('');
    }
  };

  const revealDemoOtp = async (transaction) => {
    try {
      const result = await api.getDeliveryOtp(transaction.id, buyerId);
      setOtpByTransaction((current) => ({ ...current, [transaction.id]: result.otp }));
    } catch (error) {
      setNotice(error.message || t('marketplace.otpUnavailable'));
    }
  };

  const verifyDelivery = async (transaction) => {
    const otp = String(otpByTransaction[transaction.id] || '');
    if (!/^\d{4}$/.test(otp)) {
      setNotice(t('marketplace.enterOtp'));
      return;
    }
    if (!qualityByTransaction[transaction.id]) {
      setNotice(t('marketplace.confirmQuality'));
      return;
    }
    setBusy(transaction.id);
    try {
      await api.verifyEscrowDelivery(transaction.id, otp, true, buyerId);
      setNotice(t('marketplace.deliveryVerified'));
      await refresh();
      onChanged?.();
    } catch (error) {
      setNotice(error.message || t('marketplace.deliveryFailed'));
    } finally {
      setBusy('');
    }
  };

  const cropLabel = (value) => {
    if (value === 'All') return t('marketplace.all');
    const key = String(value || '').toLowerCase();
    return t(`crops.${key}`, { defaultValue: value });
  };
  const varietyLabel = (listing) => listing.variety === 'Red Onion' ? t('marketplace.redOnion') : (listing.variety || cropLabel(listing.crop));
  const harvestLabel = (value) => {
    if (!value) return t('marketplace.recently');
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(i18n.resolvedLanguage || i18n.language, { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const escrowStatusLabel = (value) => ({
    awaiting_payment: t('marketplace.statusAwaiting'),
    funds_locked: t('marketplace.statusLocked'),
    released: t('marketplace.statusReleased')
  }[value] || String(value || '').replaceAll('_', ' '));

  return (
    <section id="direct-marketplace" className="direct-marketplace">
      <div className="marketplace-head">
        <div>
          <p className="eyebrow">{t('marketplace.eyebrow')}</p>
          <h2>{t('marketplace.title')}</h2>
          <p>{t('marketplace.subtitle')}</p>
        </div>
        <div className="marketplace-buyer-switcher">
          <small>{t('marketplace.demoBuyer')}</small>
          <select value={buyerId} onChange={(event) => setBuyerId(event.target.value)}>
            {DEMO_BUYERS.map((buyer) => <option key={buyer.id} value={buyer.id}>{buyer.name}</option>)}
          </select>
        </div>
      </div>

      <div className="marketplace-trust-row">
        <span><LockKeyhole size={17}/> {t('marketplace.fundsLocked')}</span>
        <span><PackageCheck size={17}/> {t('marketplace.otpProof')}</span>
        <span><IndianRupee size={17}/> {t('marketplace.platformFee', { fee: feePercent })}</span>
        <span><Truck size={17}/> {t('marketplace.splitPayout')}</span>
      </div>

      <div className="marketplace-toolbar">
        <strong>{buyerName}</strong>
        <label>{t('marketplace.crop')}<select value={crop} onChange={(event) => setCrop(event.target.value)}>{crops.map((item) => <option key={item} value={item}>{cropLabel(item)}</option>)}</select></label>
      </div>

      {notice && <div className="marketplace-notice" role="status">{notice}</div>}

      <div className="marketplace-grid">
        {loading ? <MarketplaceListingsLoader /> : visibleListings.map((listing) => (
          <article className="marketplace-card" key={listing.id}>
            <div className="marketplace-card-top"><span className="marketplace-crop">{cropLabel(listing.crop)}</span><span className="marketplace-verified"><ShieldCheck size={15}/> {t('marketplace.verifiedFarmer')}</span></div>
            <h3>{varietyLabel(listing)}</h3>
            <p>{listing.grade ? t('marketplace.grade', { grade: listing.grade }) : t('marketplace.gradedProduce')} · {t('marketplace.harvested', { date: harvestLabel(listing.harvestDate) })}</p>
            <div className="marketplace-price"><strong>{money(listing.askingPrice)}/{t('page.quintals')}</strong><span>{t('marketplace.available', { quantity: listing.quantity })}</span></div>
            <div className="marketplace-meta"><span>{listing.location}</span><span>{listing.destinationMandiName || t('marketplace.directPickup')}</span></div>
            <div className="marketplace-farmer"><strong>{listing.farmer?.name || t('marketplace.verifiedFarmer')}</strong><small>{listing.farmer?.district || ''}</small></div>
            <button className="marketplace-buy" disabled={busy === listing.id} onClick={() => buyListing(listing)}><ShoppingCart size={17}/>{busy === listing.id ? t('marketplace.securing') : t('marketplace.buySecurely')}</button>
          </article>
        ))}
        {!loading && !visibleListings.length && <div className="marketplace-empty">{t('marketplace.noListings')}</div>}
      </div>

      <div className="marketplace-purchases">
        <div className="marketplace-subhead"><div><p className="eyebrow">{t('marketplace.escrowActivity')}</p><h3>{t('marketplace.securePurchases')}</h3></div><span>{purchases.length}</span></div>
        {!purchases.length && <div className="marketplace-empty">{t('marketplace.noPurchases')}</div>}
        {purchases.map((transaction) => (
          <article className="escrow-purchase" key={transaction.id}>
            <div className="escrow-purchase-main">
              <div className="escrow-status"><LockKeyhole size={15}/>{escrowStatusLabel(transaction.escrowStatus)}</div>
              <strong>{cropLabel(transaction.crop)} · {transaction.quantity} {t('page.quintals')} · {money(transaction.grossAmount)}</strong>
              <p>{t('marketplace.farmerPayout')} {money(transaction.farmerPayout)} · {t('marketplace.transporterPayout')} {money(transaction.transporterPayout)} · {t('marketplace.platform')} {money(transaction.platformFee)} ({transaction.platformFeePercent || 1.5}%)</p>
              <div className="escrow-progress">
                <span className={transaction.escrowStatus === 'funds_locked' || transaction.escrowStatus === 'released' ? 'done' : ''}>1. {t('marketplace.stepFunds')}</span>
                <span className={['delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>2. {t('marketplace.stepDelivered')}</span>
                <span className={transaction.deliveryOtpVerifiedAt ? 'done' : ''}>3. {t('marketplace.stepOtp')}</span>
                <span className={transaction.escrowStatus === 'released' ? 'done' : ''}>4. {t('marketplace.stepReleased')}</span>
              </div>
            </div>
            <div className="escrow-actions">
              {transaction.escrowStatus === 'awaiting_payment' && <button className="primary-button" type="button" disabled={busy === transaction.id} onClick={() => fundExistingEscrow(transaction)}><LockKeyhole size={15}/> {t('marketplace.fundEscrow')}</button>}
              {transaction.status === 'delivered' && transaction.escrowStatus === 'funds_locked' && <>
                {transaction.demoDeliveryOtp && !otpByTransaction[transaction.id] && <button className="outline-button" type="button" onClick={() => revealDemoOtp(transaction)}>{t('marketplace.showDemoOtp')}</button>}
                <label className="escrow-quality-check"><input type="checkbox" checked={Boolean(qualityByTransaction[transaction.id])} onChange={(event) => setQualityByTransaction((current) => ({ ...current, [transaction.id]: event.target.checked }))}/><span>{t('marketplace.qualityConfirm')}</span></label>
                <input inputMode="numeric" maxLength={4} placeholder={t('marketplace.otpPlaceholder')} value={otpByTransaction[transaction.id] || ''} onChange={(event) => setOtpByTransaction((current) => ({ ...current, [transaction.id]: event.target.value.replace(/\D/g, '').slice(0, 4) }))}/>
                <button className="primary-button" type="button" disabled={busy === transaction.id || !qualityByTransaction[transaction.id]} onClick={() => verifyDelivery(transaction)}>{t('marketplace.verifyRelease')}</button>
              </>}
              {transaction.escrowStatus === 'released' && <span className="escrow-released"><CheckCircle2 size={16}/> {t('marketplace.payoutReleased')}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
