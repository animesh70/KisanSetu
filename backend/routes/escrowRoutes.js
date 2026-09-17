import { Router } from 'express';
import { cropLots, transactions } from '../data/sampleData.js';
import { requireRole } from '../middleware/auth.js';
import { getEscrowPublicConfig, lockRazorpayRouteTransfers, releaseEscrowTransfers, verifyDeliveryOtp, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '../services/escrowService.js';

const router = Router();

router.get('/config', (req, res) => res.json(getEscrowPublicConfig()));

router.post('/razorpay/verify', requireRole('buyer'), async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  const transaction = transactions.find((item) => item.escrowOrderId === orderId && item.buyerId === req.user.id);
  if (!transaction) return res.status(404).json({ message: 'Escrow transaction not found.' });
  if (!verifyRazorpayPaymentSignature({ orderId, paymentId, signature })) return res.status(400).json({ message: 'Payment signature verification failed.' });
  try {
    const transfers = await lockRazorpayRouteTransfers({ transaction, paymentId });
    transaction.escrowPaymentId = paymentId;
    transaction.escrowTransfers = transfers.map((item) => ({ id: item.id, amount: item.amount, status: item.status, onHold: item.on_hold }));
    transaction.escrowStatus = 'funds_locked';
    transaction.paymentStatus = 'escrow_locked';
    const lot = cropLots.find((item) => item.id === transaction.lotId);
    if (lot && transaction.source === 'direct_marketplace') {
      if (Number(transaction.remainingQuantity) <= 0) lot.status = 'closed';
      else lot.quantity = Number(transaction.remainingQuantity);
    }
    transaction.auditLog.push({ event: 'Razorpay payment verified and Route transfers locked', at: new Date().toISOString() });
    return res.json(transaction);
  } catch (error) {
    return res.status(502).json({ message: 'Payment was verified, but escrow transfer locking could not be completed.' });
  }
});


router.get('/transactions/:id/payment-session', requireRole('buyer'), (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id && item.buyerId === req.user.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  if (transaction.escrowProvider !== 'razorpay' || !transaction.escrowOrderId) return res.status(409).json({ message: 'This transaction does not require a Razorpay checkout session.' });
  if (transaction.escrowStatus !== 'awaiting_payment') return res.status(409).json({ message: 'This escrow transaction is not awaiting payment.' });
  return res.json({
    provider: 'razorpay',
    orderId: transaction.escrowOrderId,
    amountPaise: Math.round(Number(transaction.grossAmount || 0) * 100),
    razorpayKeyId: getEscrowPublicConfig().razorpayKeyId
  });
});

router.get('/transactions/:id/delivery-otp', requireRole('buyer'), (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id && item.buyerId === req.user.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  if (!getEscrowPublicConfig().otpExposedInDemo || !transaction.demoDeliveryOtp) return res.status(403).json({ message: 'The delivery OTP is sent through the configured secure delivery channel.' });
  return res.json({ otp: transaction.demoDeliveryOtp, demo: true });
});

router.post('/transactions/:id/verify-delivery', requireRole('buyer'), async (req, res) => {
  const transaction = transactions.find((item) => item.id === req.params.id && item.buyerId === req.user.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
  if (transaction.status !== 'delivered') return res.status(409).json({ message: 'Delivery must be marked as arrived before OTP verification.' });
  if (transaction.escrowStatus !== 'funds_locked') return res.status(409).json({ message: 'Escrow funds are not in a releasable state.' });
  if (req.body?.qualityAccepted !== true) return res.status(400).json({ message: 'Confirm crop arrival and quality before releasing escrow.' });
  const otp = String(req.body?.otp || '');
  if (!/^\d{4}$/.test(otp)) return res.status(400).json({ message: 'Enter the 4-digit delivery OTP.' });
  if (!verifyDeliveryOtp(transaction, otp)) {
    const locked = transaction.deliveryOtpAttempts >= 5;
    return res.status(locked ? 429 : 400).json({ message: locked ? 'Too many incorrect OTP attempts.' : 'The delivery OTP is incorrect.' });
  }
  try {
    const release = await releaseEscrowTransfers(transaction);
    transaction.escrowStatus = release.released ? 'released' : 'release_pending';
    transaction.paymentStatus = release.released ? 'paid' : 'release_pending';
    transaction.status = release.released ? 'completed' : 'delivered';
    transaction.escrowReleasedAt = release.released ? new Date().toISOString() : null;
    transaction.qualityAcceptedAt = new Date().toISOString();
    transaction.auditLog.push({ event: 'Buyer confirmed crop arrival/quality and verified delivery OTP; escrow release initiated', at: new Date().toISOString() });
    return res.json(transaction);
  } catch {
    transaction.escrowStatus = 'release_pending';
    transaction.paymentStatus = 'release_pending';
    transaction.auditLog.push({ event: 'Delivery verified; escrow release pending provider retry', at: new Date().toISOString() });
    return res.status(202).json(transaction);
  }
});

export function handleRazorpayWebhook(req, res) {
  const signature = req.header('x-razorpay-signature');
  if (!verifyRazorpayWebhookSignature(req.body, signature)) return res.status(400).json({ message: 'Invalid webhook signature.' });
  let event;
  try { event = JSON.parse(req.body.toString('utf8')); }
  catch { return res.status(400).json({ message: 'Invalid webhook payload.' }); }
  const transfer = event?.payload?.transfer?.entity;
  if (transfer?.id) {
    const transaction = transactions.find((item) => Array.isArray(item.escrowTransfers) && item.escrowTransfers.some((row) => row.id === transfer.id));
    if (transaction) {
      transaction.escrowTransfers = transaction.escrowTransfers.map((row) => row.id === transfer.id ? { ...row, status: transfer.status, onHold: transfer.on_hold } : row);
      transaction.auditLog.push({ event: `Razorpay webhook: ${event.event}`, at: new Date().toISOString() });
      if (event.event === 'transfer.processed' && transaction.deliveryOtpVerifiedAt) {
        const allProcessed = transaction.escrowTransfers.every((row) => row.status === 'processed');
        if (allProcessed) {
          transaction.escrowStatus = 'released';
          transaction.paymentStatus = 'paid';
          transaction.status = 'completed';
          transaction.escrowReleasedAt = new Date().toISOString();
        }
      }
    }
  }
  return res.json({ received: true });
}

export default router;
