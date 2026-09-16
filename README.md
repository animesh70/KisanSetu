# KisanSetu

**SIH 2026 — PS26132: Strengthening Market Linkages and Price Discovery for Farmers**

KisanSetu is a market-intelligence and transaction platform that helps farmers and FPOs discover fair prices, create quality-assured crop lots, find verified buyers, receive offers, coordinate logistics, and track payments.

## Project status

Hackathon-ready prototype with a working React frontend, Express API, lightweight forecasting service, buyer matching, negotiation, logistics selection, payment tracking, MongoDB-backed Shared Logistics, and MongoDB/Mongoose-backed P2P Equipment Sharing. The original plan and MVP specification are in [docs/phase-1-plan.md](docs/phase-1-plan.md).

## Technology used in this prototype

- Frontend: React 18 + Vite + i18next + Lucide React + Tailwind/PostCSS tooling
- Backend: Node.js + Express
- Database: MongoDB Atlas / MongoDB Node.js driver for geospatial Shared Logistics, plus Mongoose for Equipment Sharing
- ML price service: Python + FastAPI + scikit-learn
- Crop image service: standalone FastAPI CropVision ML service deployed separately
- Speech: Microsoft Azure Speech for multilingual read-aloud
- Demo data: hybrid architecture — resettable in-memory seeded data for the core market/offer/transaction flow, with MongoDB persistence for geospatial lot mirrors and equipment marketplace data

MongoDB is actively connected for Shared Logistics and P2P Equipment Sharing. The existing crop-lot, offer, transaction, and core hackathon demo flows intentionally remain resettable/in-memory unless otherwise noted.

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
- **AI Crop & Price Advisor** with browser microphone input, Azure-generated multilingual read-aloud audio, a seven-day advisor endpoint, and validated crop-image uploads. Crop-photo screening uses the configured standalone ML service; its results are informational and require expert confirmation, not a definitive agronomic diagnosis.
- **12-language i18next interface**: English, Hindi, Marathi, Urdu, Turkish, Spanish, Punjabi, Odia, Bengali, Gujarati, Telugu, and Tamil. Urdu also switches the page to an RTL-aware layout.
- **Offline-first PWA shell** with an install manifest, service worker, offline page, connection indicator, and cached read-only market/API responses. Transaction-changing actions remain network-only.
- **Shared Logistics** using MongoDB GeoJSON, a `2dsphere` index, and `$near` queries to find compatible open lots going to the same mandi within a configurable radius (15 km by default).
- **P2P Equipment Sharing** using MongoDB + Mongoose for machinery listings, availability filtering, rental requests, owner approval/rejection, cancellation/completion, and demo-user switching.
- **Chat-controlled Oneko kitty** that can be enabled or disabled with deterministic local commands without sending those commands to the backend.

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
| Price advisor | `GET /api/advisor/price?crop=Onion&days=7` | Normalized prototype price outlook and sell/hold signal. |
| Crop image advisor | `POST /api/advisor/disease?crop=Tomato` | Accept a JPG, PNG, or WebP body (maximum 6 MB); the backend sends it to the configured standalone CropVision ML service and returns a safe screening result. |
| Azure speech | `POST /api/tts` | Convert exact localized assistant text into MP3 using the whitelisted Azure voice for the selected language. |
| Crop lots | `GET/POST /api/lots` | View or publish a farmer crop lot. |
| Shared logistics | `GET /api/lots/:id/shared-logistics?radiusKm=15` | Find nearby open lots going to the same mandi and estimate pooled freight savings. |
| Equipment | `GET/POST /api/equipment` | Browse/filter machinery or publish a farmer/FPO listing. |
| Equipment rentals | `POST /api/equipment/:id/rent`, `GET /api/equipment/rentals/mine`, `PATCH /api/equipment/rentals/:id/status` | Request, review, approve/reject, cancel, or complete equipment rentals. |
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

For crop-photo screening, configure `CROP_VISION_URL` (the deployed service base URL) and `CROP_VISION_API_KEY` in the backend's private `.env`. Only the backend uploads image bytes to `/predict`; the browser never contacts that service or receives its key. `CROP_VISION_TIMEOUT_MS` defaults to 60000 (60 seconds) to accommodate cold starts. Without configuration, `/api/advisor/disease` returns a safe 503; upstream failures never produce a guessed diagnosis.

For multilingual read-aloud, add a Microsoft Azure Speech resource and configure these **backend-only** values in `backend/.env` and in the deployed backend service environment:

```text
AZURE_SPEECH_KEY=your-server-side-speech-key
AZURE_SPEECH_REGION=your-resource-region
```

Never prefix the key with `VITE_`, place it in frontend code, or commit the local `.env`. Without these values the rest of KisanSetu continues to work, while read-aloud returns a localized temporary-unavailable message.

For MongoDB-backed Shared Logistics and Equipment Sharing, configure these backend-only values in `backend/.env`:

```text
MONGODB_URI=your-private-mongodb-connection-string
MONGODB_DB_NAME=kisansetu
SHARED_LOGISTICS_RADIUS_KM=15
SHARED_LOGISTICS_MAX_MATCHES=20
EQUIPMENT_DEMO_SEED_ENABLED=true
```

`MONGODB_URI` must never be exposed through a `VITE_*` variable or committed to Git. If MongoDB is unavailable, the core in-memory KisanSetu demo continues to run; MongoDB-dependent features return safe temporary-unavailable responses.

TTS audio uses two bounded in-memory cache layers. The frontend keeps up to 75 returned MP3 `Blob` objects per page session and reuses them for the exact same language and text; it creates and revokes a temporary object URL for every playback. The backend keeps up to 200 voice-aware MP3 entries for 24 hours and coalesces identical requests that arrive while Azure synthesis is still running. **The backend TTS cache is memory-only and resets when the backend process restarts or redeploys.** No persistent cache or Redis service is used.

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

The browser can install KisanSetu as a PWA after the first successful load. Microphone speech recognition still depends on browser Web Speech support and permission. Read-aloud does **not** depend on installed device voices: the backend sends the exact localized text to Microsoft Azure Speech and the browser only plays the returned MP3. Speech generation requires an internet connection and valid backend Azure configuration. Previously opened pages and successful GET responses can be read from cache when offline, while lot, offer, logistics, payment, and speech-generation requests correctly require connectivity.

For a production build check:

```powershell
npm run build
```

### Chat-controlled kitty effect

The KisanSetu Advisor can control the optional pixel-art Oneko follower directly from the normal chat input:

- `kitty effect on` — show one kitty near the top-right; it follows the pointer and uses the original directional, idle, sleeping, and scratching animations.
- `kitty effect off` — immediately hide the kitty and clean up its mouse listener and animation frame.
- Optional aliases: `kitty on`, `enable kitty`, `kitty off`, and `disable kitty`.

Commands are trimmed, case-insensitive, handled entirely in the frontend, and never sent to an AI or backend endpoint. Repeated ON commands do not create duplicate instances. The React adaptation is in `frontend/src/components/PochitaFollower.jsx`, and the original sprite sheet is served from `frontend/public/oneko.gif` with `pointer-events: none` so it never blocks the interface.

The KisanSetu follower integration is maintained by [animesh70](https://github.com/animesh70) and builds on the MIT-licensed [oneko.js](https://github.com/adryd325/oneko.js) project.

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
9. Open **Equipment sharing**, request a demo machine as one farmer, switch to its owner using the sidebar profile switcher, and approve/reject the rental.
10. Demonstrate **Shared freight** on geo-enabled crop lots going to the same mandi.
11. Use **Reset demo** before the next presentation; this also clears equipment rentals, removes user-created equipment listings, and restores the demo machinery set.

## Shared Logistics geospatial matching

Shared Logistics is an additive MongoDB-backed geospatial feature. Existing crop lots, offers, transactions, price forecasting, CropVision, Azure TTS, and browser STT keep their current behavior; MongoDB is used only as a spatial mirror for lots that have a pickup point and destination mandi.

A geo-enabled lot stores its pickup position internally as GeoJSON:

```json
{
  "type": "Point",
  "coordinates": [74.08, 20.08]
}
```

GeoJSON coordinates are always **`[longitude, latitude]`**. The browser only requests location after the farmer presses **Use current location**. Exact pickup coordinates are not returned by the public lot list or shared-logistics response.

The backend mirrors eligible lots into the `lot_geo` collection and ensures these indexes:

```js
{ pickupPoint: "2dsphere" }
{ destinationMandiId: 1, status: 1 }
```

`GET /api/lots/:id/shared-logistics?radiusKm=15` runs a MongoDB `$near` query for other **open** lots going to the **same destination mandi** within the configured radius. The default radius is 15 km (15,000 metres), and the result count is bounded. Crop type is intentionally not part of the query: two nearby farmers can potentially share a vehicle even when they are transporting different crops to the same mandi.

The response estimates independent freight versus pooled freight using the existing transport provider capacity and rate. It combines quantity, required trips, the longest known mandi route, and a conservative pickup-cluster detour derived from Haversine distance after MongoDB has already narrowed the candidates. Estimated savings are clamped at zero; if pooling is not cheaper, the response sets `shareRecommended: false`. This is a freight-pooling estimate, not an optimized vehicle-routing guarantee.

Install the backend MongoDB driver and configure these backend-only values:

```powershell
cd backend
npm install mongodb@6.20.0
```

```text
MONGODB_URI=your-private-mongodb-connection-string
MONGODB_DB_NAME=kisansetu
SHARED_LOGISTICS_RADIUS_KM=15
SHARED_LOGISTICS_MAX_MATCHES=20
```

Never expose `MONGODB_URI` through a `VITE_*` variable or frontend code. If MongoDB is missing or temporarily unavailable, normal lot creation and the rest of KisanSetu continue to work; only the shared-logistics endpoint returns a safe temporary-unavailable response.

The seeded Niphad lot uses a clearly demo-only approximate pickup point near Niphad for UI/testing purposes. User-created pickup coordinates come from explicit browser geolocation permission.

## P2P Equipment Sharing

KisanSetu includes an optional MongoDB/Mongoose-backed farmer-to-farmer equipment marketplace. It reuses the private `MONGODB_URI` and `MONGODB_DB_NAME` already used by Shared Logistics, but stores equipment data in separate Mongoose collections:

- `equipment_listings` — farmer machinery listings, pricing, condition, location, and availability windows.
- `equipment_rentals` — rental requests and their requested/approved/rejected/cancelled/completed lifecycle.

The rest of KisanSetu still starts without MongoDB. If MongoDB is unavailable, only `/api/equipment` returns a safe temporary-unavailable response.

Install the additional backend dependency after pulling this feature:

```powershell
cd backend
npm install mongoose@8.23.1
```

This also updates `backend/package-lock.json`; commit the updated lock file after installation.

The feature uses the existing backend-only MongoDB settings:

```text
MONGODB_URI=your-private-mongodb-connection-string
MONGODB_DB_NAME=kisansetu
EQUIPMENT_DEMO_SEED_ENABLED=true
```

`EQUIPMENT_DEMO_SEED_ENABLED=true` inserts three demo listings only when the equipment collection is empty so the hackathon UI has machinery to browse immediately. Set it to `false` to disable demo seeding.

### Equipment API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/equipment` | List/filter active machinery by type, district, maximum daily rate, and requested date window. |
| `POST /api/equipment` | Farmer/FPO publishes an equipment listing. |
| `GET /api/equipment/:id` | Read one listing. |
| `DELETE /api/equipment/:id` | Owner removes a listing when it has no active rental request. |
| `POST /api/equipment/:id/rent` | Send a rental request for a date range. |
| `GET /api/equipment/rentals/mine` | View rental activity for the demo farmer as renter and owner. |
| `PATCH /api/equipment/rentals/:id/status` | Owner approves/rejects/completes; renter can cancel. |

Availability filtering excludes listings with overlapping requested or approved rentals. Creating a request also performs a second conflict check so overlapping bookings cannot be created just by bypassing the frontend. Rental prices use a snapshot of the listing's daily rate at request time.

The frontend adds **Equipment sharing** to the sidebar with responsive listing cards, filters, equipment-listing and rental modals, and rental request status controls. For the hackathon demo, the existing farmer profile card at the bottom of the sidebar doubles as the compact account switcher, so you can request equipment as one farmer and switch to the owner to approve or reject it without adding another bulky control inside the marketplace. The demo identities are `farmer-1` Sanjay Patil, `farmer-2` Mahesh Jadhav, `farmer-3` Asha More, and `farmer-4` Ramesh Shinde. The switcher changes only the identity used by `/api/equipment`; crop lots, offers and transaction demo identity remain unchanged.

Rental activity keeps the status badge and owner actions together. Incoming requests use compact **Approve** and **Reject** controls so the action area stays aligned on desktop and stacks cleanly on small screens.

**Reset demo** now clears `equipment_rentals`, removes user-created equipment listings, reseeds the three starter demo machines when equipment demo seeding is enabled, resets the equipment account to Sanjay, and refreshes the equipment marketplace. This keeps MongoDB-backed equipment data in sync with the rest of the resettable prototype.

The KisanSetu Assistant also understands Equipment Sharing questions. It can explain how to list or rent machinery, how owners approve/reject requests, summarize the selected demo farmer's rental activity, and show currently available equipment from the live `/api/equipment` data. The assistant's general introduction mentions equipment sharing, and the equipment help text is localized with the same 12-language setup used elsewhere in KisanSetu.
