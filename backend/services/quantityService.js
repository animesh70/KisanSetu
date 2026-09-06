export const MAX_LOT_QUANTITY_QUINTALS = 5000;

export function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LOT_QUANTITY_QUINTALS) {
    throw new Error(`Quantity must be a whole number from 1 to ${MAX_LOT_QUANTITY_QUINTALS.toLocaleString('en-IN')} quintals.`);
  }
  return quantity;
}
