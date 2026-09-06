# Changelog

## 2026-09-06 — Market-data safeguards

- Added server-side quantity validation: crop lots and selling recommendations accept whole quantities from 1 to 5,000 quintals only.
- Replaced the unrealistic quantity-divided transport estimate with a documented demo rate of ₹0.45/km/quintal (minimum ₹8/quintal), so net prices do not become misleading for larger lots.
- Made `GET /api/buyers?crop=...` crop-aware and connected the dashboard buyer cards to it.
- Added a verified Soybean buyer so every seeded crop has a complete demo matching path.
- Added Node unit tests for crop matching, quantity validation, and transport estimation.
- Selected logistics now carries into a new transaction's simulated fee and net-payable calculation; pickup cannot be scheduled until logistics is chosen.

All market, buyer, logistics, and payment data remains explicitly simulated for the hackathon prototype.
