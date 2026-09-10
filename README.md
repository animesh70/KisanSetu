# KisanSetu

**SIH 2026 — PS26132: Strengthening Market Linkages and Price Discovery for Farmers**

KisanSetu is a market-intelligence and transaction platform that helps farmers and FPOs discover fair prices, create quality-assured crop lots, find verified buyers, receive offers, coordinate logistics, and track payments.

## Project status

Hackathon-ready prototype with a working frontend, sample-data API, lightweight forecast service, buyer matching, negotiation, logistics selection, and payment-tracking journey. The original plan and MVP specification are in [docs/phase-1-plan.md](docs/phase-1-plan.md).

## Technology used in this prototype

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- ML service: Python + FastAPI + scikit-learn
- Demo data store: resettable in-memory seeded data

MongoDB remains the planned persistence layer for a production deployment, but it is not connected in this demo build. This keeps the resettable hackathon flow reliable without claiming persistence that is not present.

## MVP flow

Farmer/FPO → Market prices and forecast → Crop lot → Buyer matches → Offer → Logistics → Payment tracking

## Demo features

- Mandi rate comparison with capacity-aware transport quotes and estimated net realisation per quintal
- Guardrails for quantities: whole numbers from 1 to 5,000 quintals, enforced by both the UI and API
- Crop-aware buyer matching: only buyers that list demand for the chosen crop appear, with a complete demo path for Onion, Tomato, and Soybean
- Seven-day trend and an explainable **Sell now / Hold** recommendation that compares forecast value with storage and transport costs
- Optional crop variety, grade, quantity, harvest date, and pickup-location details for crop lots
- **My crop lots** view so published lots remain visible after submission
- Automatically generated buyer match after an eligible demo lot is created
- Buyer ranking based on offer price, distance, tradable quantity, grade, and reliability
- Offer negotiation: accept, decline, or send a counter-offer
- Logistics and storage selection
- Logistics selection is included in the simulated transaction estimate; transport trips respect provider capacity and pickup scheduling requires a selected option
- Transaction steps: pickup → transit → delivery → payment confirmation
- Payment amount, demo payment method, status, and reference ID
- Mobile navigation drawer, responsive forms, notification centre, and floating action feedback

## Data transparency

This prototype intentionally labels its demo data in the interface:

- **Mandi prices and buyer profiles** are seeded/simulated hackathon data, not live market or verified commercial data.
- **Forecasts** are trained only from seeded price history. The ML service compares small candidate models using chronological walk-forward validation; if it is unavailable, the backend returns a labelled local demo fallback.
- **Buyer offers, payment references, logistics availability, and verification status** are simulated for demonstration. They must be replaced by authorised data providers, payment partners, and verification processes before production deployment.
- Forecasts, recommendations, and logistics quotes are planning aids for the demo, not live prices, carrier quotes, financial advice, or guaranteed outcomes.

## Core API endpoints

| Area | Endpoint | Purpose |
| --- | --- | --- |
| Health | `GET /api/health` | Confirm the API is available. |
| Markets | `GET /api/markets/prices?crop=Onion&quantity=100`, `/trends`, `/forecast` | Demo prices, capacity-aware transport/net estimates, trend, and forecast. |
| Crop lots | `GET/POST /api/lots` | View or publish a farmer crop lot. |
| Recommendations | `GET /api/recommendations/sell` | Storage-aware sell/hold recommendation and net-price options. |
| Buyers | `GET /api/buyers?crop=Tomato` | Demo buyers, optionally filtered to the selected crop. |
| Offers | `GET/PATCH /api/offers/:id` | View, accept, decline, or counter a buyer offer. |
| Transactions | `GET /api/transactions`, `PATCH /api/transactions/:id/status` | Track logistics steps and payment status. |
| Demo reset | `POST /api/demo/reset` | Restore the initial demo data for a new presentation. |

For demo-protected farmer actions, the frontend sends `x-demo-role: farmer` and `x-demo-user-id: farmer-1`. These are only mock role checks and are not production authentication.

### Price, quantity, and logistics assumptions

All economics are simulated. A transport quote uses the applicable demo provider's `rate per km × distance × required trips`, where trips are rounded up from the provider capacity and the resulting total is spread across the **tradable quantity**. Storage uses `quantity × daily storage rate × holding days`. This makes partial buyer matches and vehicle capacity visible in the net-realisation estimate instead of using a single flat transport rate. Inputs are restricted to whole lots from **1 to 5,000 quintals**. Market prices, buyer profiles, provider availability, and payment tracking remain simulated.

The sell/hold decision compares the best current net option with forecasted net options after storage and route costs. It recommends holding only when storage is available and the estimated advantage exceeds both the demo minimum threshold and any available forecast validation error.

## Run the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

The API runs at `http://localhost:5000`. Try `GET /api/health` or `GET /api/markets/prices?crop=Onion`.

With the API running, verify the core endpoints in a second terminal:

```powershell
cd backend
npm run test:smoke
```

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Keep the backend running to use crop-lot publishing, offers, transactions, and payment tracking. The market dashboard can show curated fallback data if the backend is unavailable.

For a production build check:

```powershell
npm run build
```

## Run the ML price-prediction service

```powershell
cd ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

It trains one lightweight model per crop from [sample price history](ml-service/data/mandi_price_history.csv). It compares a persistence baseline, Linear Regression, Gradient Boosting, and Random Forest with chronological walk-forward MAE, then selects the simplest model close to the best result; the persistence baseline is retained when history is insufficient. The saved artifact includes the selected model and validation metadata; missing or unreadable demo artifacts are rebuilt from the tracked sample history. Forecast days are generated recursively from previously known or predicted values, never from future actual prices.

The backend calls `GET http://localhost:8000/predict?crop=Onion&days=7`. Responses include the selected model, forecast strategy, and validation metadata when available. If the ML service is offline, the backend continues with a clearly labelled seeded-history demo fallback.

## Demo script

1. Choose crop, location, and quantity, then select **Check prices**.
2. Compare gross price, capacity-aware transport, tradable quantity, and estimated net realisation.
3. Explain the Sell/Hold recommendation, including storage cost, forecast uncertainty, and its simulated-data disclaimer.
4. Create a crop lot; variety may be left blank.
5. Open **My crop lots** to show the published lot, then review its generated buyer offer.
6. Counter, decline, or accept the offer. Accepting creates a transaction.
7. Select a logistics option and advance the transaction through pickup, transit, and delivery.
8. Confirm payment received and point out the payment reference and final paid status.
9. Use **Reset demo** before the next presentation.
