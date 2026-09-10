# Changelog

## 2026-09-10 — Forecasting and economics hardening

- Replaced the flat ₹0.45/km/quintal estimate with one shared, capacity-aware demo quote: provider rate per kilometre × distance × required vehicle trips, spread across the actual tradable quantity.
- Standardised tradable and remaining quantities across buyer matching, generated offers, and transactions so partial matches do not use a full lot's value.
- Added storage quotes and storage-aware sell/hold economics. Holding is recommended only when storage is available and estimated net gain clears the configured minimum and available forecast MAE.
- Updated the ML service to compare a persistence baseline, Linear Regression, Gradient Boosting, and Random Forest using chronological walk-forward MAE. It records selection/validation metadata and produces recursive forecasts without future actual prices.
- Made the ML artifact resilient for the demo: a missing or unreadable local artifact is retrained from the tracked seeded price history; backend fallback forecasts remain clearly labelled.

All forecasts, prices, buyer data, logistics quotes, payments, and verification signals remain simulated hackathon data, not live services or guarantees.

## 2026-09-06 — Market-data safeguards

- Added server-side quantity validation: crop lots and selling recommendations accept whole quantities from 1 to 5,000 quintals only.
- Made `GET /api/buyers?crop=...` crop-aware and connected the dashboard buyer cards to it.
- Added a verified Soybean buyer so every seeded crop has a complete demo matching path.
- Added Node unit tests for crop matching, quantity validation, and transport estimation.
- Selected logistics now carries into a new transaction's simulated fee and net-payable calculation; pickup cannot be scheduled until logistics is chosen.

All market, buyer, logistics, and payment data remains explicitly simulated for the hackathon prototype.
