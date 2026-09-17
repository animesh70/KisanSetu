import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, IndianRupee, LockKeyhole, PackageCheck, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { api } from '../services/api.js';

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
      setNotice(error.message || 'Marketplace data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [buyerId, refreshToken]);

  const visibleListings = useMemo(() => listings.filter((listing) => crop === 'All' || listing.crop === crop), [listings, crop]);
  const crops = useMemo(() => ['All', ...new Set(listings.map((listing) => listing.crop))], [listings]);

  const launchRazorpay = async (checkout) => {
    const ready = await loadRazorpayCheckout();
    if (!ready) throw new Error('Razorpay Checkout could not be loaded.');
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
        modal: { ondismiss: () => reject(new Error('Payment window was closed.')) },
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
        ? 'Demo escrow funded. The buyer funds are now locked until delivery OTP verification.'
        : 'Payment verified and marketplace funds are locked for delivery.');
      await refresh();
      onChanged?.();
    } catch (error) {
      setNotice(error.message || 'Secure checkout failed.');
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
      setNotice('Payment verified and buyer funds are locked for delivery.');
      await refresh();
      onChanged?.();
    } catch (error) {
      setNotice(error.message || 'Escrow funding failed.');
    } finally {
      setBusy('');
    }
  };

  const revealDemoOtp = async (transaction) => {
    try {
      const result = await api.getDeliveryOtp(transaction.id, buyerId);
      setOtpByTransaction((current) => ({ ...current, [transaction.id]: result.otp }));
    } catch (error) {
      setNotice(error.message || 'Delivery OTP is not available here.');
    }
  };

  const verifyDelivery = async (transaction) => {
    const otp = String(otpByTransaction[transaction.id] || '');
    if (!/^\d{4}$/.test(otp)) {
      setNotice('Enter the 4-digit delivery OTP.');
      return;
    }
    if (!qualityByTransaction[transaction.id]) {
      setNotice('Confirm that the crop arrived and its quality is acceptable before releasing escrow.');
      return;
    }
    setBusy(transaction.id);
    try {
      await api.verifyEscrowDelivery(transaction.id, otp, true, buyerId);
      setNotice('Delivery verified. Escrow release has been completed or queued with the payment provider.');
      await refresh();
      onChanged?.();
    } catch (error) {
      setNotice(error.message || 'Delivery verification failed.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section id="direct-marketplace" className="direct-marketplace">
      <div className="marketplace-head">
        <div>
          <p className="eyebrow">DIRECT FARMER MARKETPLACE</p>
          <h2>Buy directly from verified farm listings</h2>
          <p>Buyer funds are locked first. Farmer and transporter payouts release only after delivery verification.</p>
        </div>
        <div className="marketplace-buyer-switcher">
          <small>Demo buyer</small>
          <select value={buyerId} onChange={(event) => setBuyerId(event.target.value)}>
            {DEMO_BUYERS.map((buyer) => <option key={buyer.id} value={buyer.id}>{buyer.name}</option>)}
          </select>
        </div>
      </div>

      <div className="marketplace-trust-row">
        <span><LockKeyhole size={17}/> Funds locked</span>
        <span><PackageCheck size={17}/> OTP proof of delivery</span>
        <span><IndianRupee size={17}/> {feePercent}% platform fee</span>
        <span><Truck size={17}/> Split farmer + transporter payout</span>
      </div>

      <div className="marketplace-toolbar">
        <strong>{buyerName}</strong>
        <label>Crop<select value={crop} onChange={(event) => setCrop(event.target.value)}>{crops.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>

      {notice && <div className="marketplace-notice" role="status">{notice}</div>}

      <div className="marketplace-grid">
        {loading ? <div className="marketplace-empty">Loading secure listings…</div> : visibleListings.map((listing) => (
          <article className="marketplace-card" key={listing.id}>
            <div className="marketplace-card-top"><span className="marketplace-crop">{listing.crop}</span><span className="marketplace-verified"><ShieldCheck size={15}/> Verified farmer</span></div>
            <h3>{listing.variety || listing.crop}</h3>
            <p>{listing.grade ? `Grade ${listing.grade}` : 'Graded produce'} · Harvested {listing.harvestDate || 'recently'}</p>
            <div className="marketplace-price"><strong>{money(listing.askingPrice)}/q</strong><span>{listing.quantity} q available</span></div>
            <div className="marketplace-meta"><span>{listing.location}</span><span>{listing.destinationMandiName || 'Direct pickup'}</span></div>
            <div className="marketplace-farmer"><strong>{listing.farmer?.name || 'Verified farmer'}</strong><small>{listing.farmer?.district || ''}</small></div>
            <button className="marketplace-buy" disabled={busy === listing.id} onClick={() => buyListing(listing)}><ShoppingCart size={17}/>{busy === listing.id ? 'Securing…' : 'Buy securely'}</button>
          </article>
        ))}
        {!loading && !visibleListings.length && <div className="marketplace-empty">No open listings match this crop right now.</div>}
      </div>

      <div className="marketplace-purchases">
        <div className="marketplace-subhead"><div><p className="eyebrow">ESCROW ACTIVITY</p><h3>My secure purchases</h3></div><span>{purchases.length}</span></div>
        {!purchases.length && <div className="marketplace-empty">No direct marketplace purchases for this buyer yet.</div>}
        {purchases.map((transaction) => (
          <article className="escrow-purchase" key={transaction.id}>
            <div className="escrow-purchase-main">
              <div className="escrow-status"><LockKeyhole size={15}/>{String(transaction.escrowStatus || 'awaiting').replaceAll('_', ' ')}</div>
              <strong>{transaction.crop} · {transaction.quantity} q · {money(transaction.grossAmount)}</strong>
              <p>Farmer payout {money(transaction.farmerPayout)} · Transporter {money(transaction.transporterPayout)} · Platform {money(transaction.platformFee)} ({transaction.platformFeePercent || 1.5}%)</p>
              <div className="escrow-progress">
                <span className={transaction.escrowStatus === 'funds_locked' || transaction.escrowStatus === 'released' ? 'done' : ''}>1. Funds locked</span>
                <span className={['delivered', 'completed'].includes(transaction.status) ? 'done' : ''}>2. Crop delivered</span>
                <span className={transaction.deliveryOtpVerifiedAt ? 'done' : ''}>3. OTP verified</span>
                <span className={transaction.escrowStatus === 'released' ? 'done' : ''}>4. Split released</span>
              </div>
            </div>
            <div className="escrow-actions">
              {transaction.escrowStatus === 'awaiting_payment' && <button className="primary-button" type="button" disabled={busy === transaction.id} onClick={() => fundExistingEscrow(transaction)}><LockKeyhole size={15}/> Fund escrow</button>}
              {transaction.status === 'delivered' && transaction.escrowStatus === 'funds_locked' && <>
                {transaction.demoDeliveryOtp && !otpByTransaction[transaction.id] && <button className="outline-button" type="button" onClick={() => revealDemoOtp(transaction)}>Show demo OTP</button>}
                <label className="escrow-quality-check"><input type="checkbox" checked={Boolean(qualityByTransaction[transaction.id])} onChange={(event) => setQualityByTransaction((current) => ({ ...current, [transaction.id]: event.target.checked }))}/><span>I confirm crop arrival and acceptable quality.</span></label>
                <input inputMode="numeric" maxLength={4} placeholder="4-digit OTP" value={otpByTransaction[transaction.id] || ''} onChange={(event) => setOtpByTransaction((current) => ({ ...current, [transaction.id]: event.target.value.replace(/\D/g, '').slice(0, 4) }))}/>
                <button className="primary-button" type="button" disabled={busy === transaction.id || !qualityByTransaction[transaction.id]} onClick={() => verifyDelivery(transaction)}>Verify & release</button>
              </>}
              {transaction.escrowStatus === 'released' && <span className="escrow-released"><CheckCircle2 size={16}/> Payout released</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
