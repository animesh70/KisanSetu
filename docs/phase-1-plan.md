# KisanSetu — Phase 1: Product Plan

## 1. Problem statement

Smallholder farmers and FPOs often sell immediately after harvest with incomplete information about nearby mandi prices, future price movement, buyer demand, quality requirements, transport, storage, and payment reliability. Buyers also struggle to source consistent, verifiable crop volumes.

**KisanSetu** strengthens market linkages by combining local market-price intelligence, price forecasts, structured crop lots, verified buyer demand, transparent offers, logistics choices, and payment status in one simple workflow.

## 2. Hackathon MVP goal

Enable a farmer or FPO to enter a crop, location, and quantity; compare nearby market prices; see a short-term price prediction; create a crop lot; receive relevant verified-buyer matches; and choose a recommended buyer/market and selling window.

The demo will use curated sample data initially. Every module will be designed so real government mandi-price APIs can replace the sample-data service later.

## 3. Users and roles

| Role | Main purpose | MVP capabilities |
| --- | --- | --- |
| Farmer/FPO | Sell produce at a better price | Profile, price search, crop-lot creation, buyer matches, offers, logistics choices, payment and grievance tracking |
| Buyer | Source reliable crop lots | Verified profile, demand requirements, matched lots, submit/manage offers, transaction tracking |
| Admin | Maintain trust and data quality | Verify buyers, moderate lots/offers, manage mandi data, resolve grievances, view platform metrics |

## 4. Core user flow

1. Farmer/FPO selects **crop**, **location**, and **available quantity**.
2. KisanSetu displays nearby mandi prices, historical movement, and a 7-day forecast.
3. The recommendation engine identifies the highest-value practical selling option using price, travel distance, buyer demand, quality fit, and forecast.
4. Farmer creates a crop lot with grade, quantity, expected price, harvest date, and photos (optional in MVP).
5. The platform lists verified buyers whose crop, quantity, grade, and location requirements match the lot.
6. Buyers submit transparent digital offers; the farmer accepts one.
7. The farmer chooses a transport/storage option and follows the transaction payment status.
8. Either party can raise a grievance linked to the transaction.

## 5. MVP modules

### Must build for the demo

1. **Farmer dashboard** — quick crop input, market summary, forecast, best-selling recommendation, matched buyers, and active transactions.
2. **Mandi price comparison** — current prices across nearby mandis, historical trend chart, and a forecast for the selected crop/location.
3. **Crop-lot management** — create, list, and view lots with crop, quantity, grade, location, and asking price.
4. **Verified buyer marketplace** — buyer cards with demand, grade requirements, capacity, location, and trust status.
5. **Matching and recommendation** — explainable score and “best option” based on market price, forecast, distance, quantity fit, and buyer reliability.
6. **Offers and transaction tracking** — submit/accept/reject offers and show transaction/payment lifecycle.
7. **Basic logistics and storage** — relevant transport/storage suggestions with estimated costs and capacity.

### Demo-supporting, lower-priority modules

- Role-based login using seeded demo accounts.
- Buyer verification workflow for the admin.
- Grievance submission/status timeline.
- Marathi/Hindi-ready language structure (English UI in the first build).

### Post-hackathon enhancements

- Live AGMARKNET/eNAM or state-market integrations.
- OTP/KYC, payment-gateway and GST integrations.
- Image-based quality grading.
- WhatsApp/SMS updates, vernacular voice input, and offline-first mobile support.

## 6. Recommendation logic for MVP

The first recommendation is deliberately explainable rather than opaque:

`score = 0.40 × expected net price + 0.25 × buyer match + 0.15 × buyer trust + 0.10 × forecast trend + 0.10 × logistics suitability`

- **Expected net price**: offered/predicted price minus estimated logistics cost.
- **Buyer match**: crop, grade, quantity, and location compatibility.
- **Buyer trust**: admin verification and completed transactions.
- **Forecast trend**: estimated price change in the next 7 days.
- **Logistics suitability**: service availability, capacity, and distance.

The ML service supplies the forecast; the backend owns the final, auditable recommendation score.

## 7. Technical architecture

```text
React + Tailwind dashboard
          ↓ REST API
Node.js + Express backend  ←→ MongoDB
          ↓ HTTP
FastAPI ML service (scikit-learn regression)
          ↓
Historical mandi-price dataset / later government data adapter
```

## 8. Initial database design

| Collection | Essential fields |
| --- | --- |
| users | name, phone/email, role, address/location, profileComplete |
| farmerProfiles | userId, type (farmer/FPO), farmSize, crops, FPO details |
| buyerProfiles | userId, companyName, verificationStatus, crops, serviceArea, reliabilityScore |
| mandiPrices | crop, variety, mandiName, district, state, date, minPrice, modalPrice, maxPrice, unit |
| cropLots | farmerId, crop, variety, quantity, unit, grade, askingPrice, location, harvestDate, status |
| buyerDemands | buyerId, crop, minimumGrade, requiredQuantity, targetPrice, location, deliveryBy, status |
| offers | lotId, buyerId, farmerId, pricePerUnit, quantity, message, status, expiryAt |
| transactions | lotId, acceptedOfferId, farmerId, buyerId, status, logisticsId, paymentStatus, amount |
| logisticsOptions | provider, type, serviceArea, capacity, rate, contact, available |
| storageOptions | provider, location, cropTypes, capacity, ratePerDay, available |
| grievances | transactionId, raisedBy, category, description, status, resolution |

## 9. API surface for implementation

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Mandi intelligence | `GET /api/markets/prices`, `GET /api/markets/trends`, `GET /api/markets/forecast` |
| Crop lots | `GET/POST /api/lots`, `GET/PATCH /api/lots/:id` |
| Buyers and matching | `GET /api/buyers`, `GET /api/matches/lots/:lotId`, `GET /api/recommendations/sell` |
| Offers | `GET/POST /api/offers`, `PATCH /api/offers/:id` |
| Transactions | `GET /api/transactions`, `PATCH /api/transactions/:id/status` |
| Logistics and storage | `GET /api/logistics`, `GET /api/storage` |
| Grievances | `GET/POST /api/grievances`, `PATCH /api/grievances/:id` |
| Admin | `GET /api/admin/buyers`, `PATCH /api/admin/buyers/:id/verification` |

## 10. Phase 2 implementation sequence

1. Create the Node/Express backend with environment configuration and seeded sample data.
2. Add MongoDB models for users, prices, lots, buyers, offers, and transactions.
3. Add demo authentication and role-based middleware.
4. Implement price, lot, buyer, match, offer, and dashboard APIs.
5. Add logistics, storage, payment, grievance, and admin-verification APIs.
6. Validate APIs with repeatable seed/demo requests before frontend integration.

## 11. Success criteria for the demo

- A farmer can complete the core flow in under three minutes.
- Recommendations show *why* an option is best, not only a score.
- Every dashboard figure can be traced to market data, a forecast, or a matching rule.
- The UI works cleanly on laptop and mobile widths.
- The demo remains fully functional using local sample data if external APIs are unavailable.
