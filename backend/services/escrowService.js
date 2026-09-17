import crypto from 'node:crypto';
import { calculatePayoutSplit, getPlatformFeePercent } from './platformFeeService.js';

const providerName = () => String(process.env.ESCROW_PROVIDER || 'demo').trim().toLowerCase();
export const isDemoEscrow = () => providerName() !== 'razorpay';

function base64BasicAuth(keyId, keySecret) {
  return Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

async function razorpayRequest(path, { method = 'GET', body } = {}) {
  if (!razorpayConfigured()) throw new Error('Razorpay is not configured.');
  const response = await fetch(`https://api.razorpay.com${path}`, {
    method,
    headers: {
      Authorization: `Basic ${base64BasicAuth(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.description || 'Razorpay request failed.');
    error.code = payload?.error?.code || 'RAZORPAY_REQUEST_FAILED';
    throw error;
  }
  return payload;
}

function safeLinkedAccountMap() {
  try {
    const parsed = JSON.parse(process.env.RAZORPAY_LINKED_ACCOUNTS_JSON || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getEscrowPublicConfig() {
  return {
    provider: providerName(),
    demoMode: isDemoEscrow(),
    razorpayKeyId: providerName() === 'razorpay' ? (process.env.RAZORPAY_KEY_ID || null) : null,
    otpExposedInDemo: isDemoEscrow() && String(process.env.ESCROW_DEMO_OTP_EXPOSE || 'true').toLowerCase() !== 'false',
    platformFeePercent: getPlatformFeePercent()
  };
}

export function generateDeliveryOtp() {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

export function createOtpRecord(otp) {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.createHash('sha256').update(`${salt}:${otp}`).digest('hex');
  return { deliveryOtpSalt: salt, deliveryOtpHash: digest, deliveryOtpAttempts: 0, deliveryOtpVerifiedAt: null };
}

export function verifyDeliveryOtp(transaction, otp) {
  if (!transaction?.deliveryOtpHash || !transaction?.deliveryOtpSalt) return false;
  if (transaction.deliveryOtpAttempts >= 5) return false;
  transaction.deliveryOtpAttempts += 1;
  const supplied = crypto.createHash('sha256').update(`${transaction.deliveryOtpSalt}:${String(otp)}`).digest();
  const stored = Buffer.from(transaction.deliveryOtpHash, 'hex');
  if (supplied.length !== stored.length) return false;
  const valid = crypto.timingSafeEqual(supplied, stored);
  if (valid) transaction.deliveryOtpVerifiedAt = new Date().toISOString();
  return valid;
}

export async function createEscrowOrder({ transactionId, amount, notes = {} }) {
  if (isDemoEscrow()) {
    return {
      provider: 'demo',
      orderId: `demo-order-${transactionId}`,
      amountPaise: Math.round(Number(amount) * 100),
      status: 'paid'
    };
  }
  const order = await razorpayRequest('/v1/orders', {
    method: 'POST',
    body: {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: String(transactionId).slice(0, 40),
      notes
    }
  });
  return { provider: 'razorpay', orderId: order.id, amountPaise: order.amount, status: order.status };
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(String(signature || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifyRazorpayWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !rawBody || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(String(signature));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function lockRazorpayRouteTransfers({ transaction, paymentId }) {
  if (isDemoEscrow()) return [];
  const accounts = safeLinkedAccountMap();
  const farmerAccount = accounts[transaction.farmerId];
  const transporterAccount = accounts['transporter-default'];
  if (!farmerAccount) throw new Error(`No Razorpay linked account configured for ${transaction.farmerId}.`);

  const split = calculatePayoutSplit({ grossAmount: transaction.grossAmount, logisticsFee: transaction.logisticsFee });
  const transfers = [
    {
      account: farmerAccount,
      amount: Math.round(split.farmerPayout * 100),
      currency: 'INR',
      on_hold: true,
      notes: { kind: 'farmer', transactionId: transaction.id }
    }
  ];
  if (split.transporterPayout > 0 && !transporterAccount) throw new Error('No Razorpay linked account configured for transporter-default.');
  if (split.transporterPayout > 0 && transporterAccount) {
    transfers.push({
      account: transporterAccount,
      amount: Math.round(split.transporterPayout * 100),
      currency: 'INR',
      on_hold: true,
      notes: { kind: 'transporter', transactionId: transaction.id }
    });
  }
  const result = await razorpayRequest(`/v1/payments/${encodeURIComponent(paymentId)}/transfers`, { method: 'POST', body: { transfers } });
  return Array.isArray(result?.items) ? result.items : [];
}

export async function releaseEscrowTransfers(transaction) {
  if (isDemoEscrow()) return { released: true, transfers: transaction.escrowTransfers || [] };
  const transfers = Array.isArray(transaction.escrowTransfers) ? transaction.escrowTransfers : [];
  if (!transfers.length) throw new Error('No held Razorpay transfers exist for this transaction.');
  const released = [];
  for (const transfer of transfers) {
    const id = transfer.id || transfer.transferId;
    if (!id) continue;
    released.push(await razorpayRequest(`/v1/transfers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { on_hold: false }
    }));
  }
  return { released: released.length > 0, transfers: released };
}
