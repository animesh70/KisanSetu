export const MAX_LOT_QUANTITY_QUINTALS = 5000;

export function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LOT_QUANTITY_QUINTALS) {
    throw new Error(`Quantity must be a whole number from 1 to ${MAX_LOT_QUANTITY_QUINTALS.toLocaleString('en-IN')} quintals.`);
  }
  return quantity;
}

/**
 * A buyer match can only cover the quantity both parties can trade. Keeping
 * this in one helper prevents offer, matching and transaction totals from
 * treating a partial buyer requirement as a full-lot purchase.
 */
export function getTradableQuantity({ lotQuantity, buyerRequiredQuantity, requestedQuantity } = {}) {
  const availableQuantity = parseQuantity(lotQuantity);
  const buyerQuantity = parseQuantity(buyerRequiredQuantity);
  const requested = requestedQuantity === undefined || requestedQuantity === null || requestedQuantity === ''
    ? buyerQuantity
    : parseQuantity(requestedQuantity);
  const tradableQuantity = Math.min(availableQuantity, buyerQuantity, requested);

  return {
    lotQuantity: availableQuantity,
    buyerRequiredQuantity: buyerQuantity,
    requestedQuantity: requested,
    tradableQuantity,
    remainingQuantity: availableQuantity - tradableQuantity
  };
}
