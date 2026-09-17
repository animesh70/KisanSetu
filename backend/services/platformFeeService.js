import { roundMoney } from './logisticsService.js';

export const DEFAULT_PLATFORM_FEE_PERCENT = 1.5;

export function getPlatformFeePercent() {
  const configured = Number(process.env.PLATFORM_FEE_PERCENT);
  if (!Number.isFinite(configured)) return DEFAULT_PLATFORM_FEE_PERCENT;
  return Math.min(2, Math.max(1, configured));
}

export function calculatePlatformFee(grossAmount, percent = getPlatformFeePercent()) {
  const gross = Math.max(0, Number(grossAmount) || 0);
  return roundMoney(gross * (Number(percent) / 100));
}

export function calculatePayoutSplit({ grossAmount, logisticsFee = 0, percent = getPlatformFeePercent() } = {}) {
  const gross = Math.max(0, Number(grossAmount) || 0);
  const transport = Math.max(0, Number(logisticsFee) || 0);
  const platformFee = calculatePlatformFee(gross, percent);
  const transporterPayout = Math.min(transport, Math.max(0, gross - platformFee));
  const farmerPayout = roundMoney(Math.max(0, gross - platformFee - transporterPayout));
  return {
    platformFeePercent: Number(percent),
    platformFee,
    transporterPayout: roundMoney(transporterPayout),
    farmerPayout,
    grossAmount: roundMoney(gross)
  };
}
